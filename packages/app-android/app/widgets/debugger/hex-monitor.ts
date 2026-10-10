import { GridLayout, Label, ScrollView } from "@nativescript/core";
import type { HexMonitorWidget, HexMonitorOptions, MemoryRegion, HexMonitorEventMap } from "@learn6502/common-ui";
import { memoryRegions } from "@learn6502/common-ui";
import type { Memory } from "@learn6502/core";
import { EventDispatcher, num2hex, addr2hex } from "@learn6502/core";

/**
 * One address column plus this many byte columns per rendered row.
 *
 * Eight, not the sixteen the GNOME and web dumps use: those scroll sideways in a
 * source view, this is a grid inside a vertical `ScrollView` with nowhere to go.
 * Measured on a 1080x2400 / 420 dpi phone, a byte column is 60 px against roughly
 * 850 px of card width, so a sixteen-byte row rendered eleven columns and dropped
 * $0b-$0f of every row off the right edge with no way to reach them.
 */
const BYTES_PER_ROW = 8;

/** A `GridLayout` row/column spec of `count` content-sized tracks. */
function autoTrack(count: number): string {
  return Array.from({ length: count }, () => "auto").join(",");
}

export class HexMonitor extends ScrollView implements HexMonitorWidget {
  readonly events = new EventDispatcher<HexMonitorEventMap>();

  readonly memoryRegions: MemoryRegion[] = memoryRegions;

  /**
   * The byte grid, built here rather than inflated from a template: this app
   * instantiates its widgets directly (`new HexMonitor()`), so no `Builder.load`
   * ever runs over a widget XML and a `getViewById("grid")` lookup found nothing —
   * which left `update()` bailing out with "Grid not initialized" and the monitor
   * permanently empty on Android.
   */
  private readonly grid: GridLayout;

  /** Byte labels in address order, and the value each one currently shows. */
  private byteLabels: Label[] = [];
  private values: number[] = [];

  /** Range the grid was last built for; -1 while nothing (or the error label) is shown. */
  private builtStart = -1;
  private builtLength = -1;

  /** Last memory handed to `update`, so the copy gesture has something to dump. */
  private lastMemory: Memory | null = null;

  /**
   * Zero Page, as in the GNOME and web debuggers (both select that region first).
   *
   * This screen renders one `Label` per byte, so the region size is a view budget,
   * not just a preference: the old Program Storage default ($0600-$FFFF) is 39424
   * bytes, i.e. upwards of forty thousand labels, and measured on an API 36 emulator
   * that exhausted the 200 MB heap and killed the app with an OutOfMemoryError before
   * a single row appeared. Anything wiring up a region selector here — the dropdown
   * the GNOME and web debuggers have and this screen does not — has to reckon with
   * that ceiling; 256 bytes is 32 rows and renders fine.
   */
  private _options: HexMonitorOptions = {
    start: 0x0000,
    length: 0x0100,
  };

  get options(): HexMonitorOptions {
    return this._options;
  }

  set options(value: HexMonitorOptions) {
    this._options = value;
    this.events.dispatch("changed", undefined!);
  }

  constructor() {
    super();
    this.className = "hex-monitor bg-surface-container";

    this.grid = new GridLayout();
    this.grid.className = "p-2";
    this.grid.columns = autoTrack(BYTES_PER_ROW + 1);
    this.content = this.grid;

    // Registered once. `update()` runs on every debugger refresh, so subscribing
    // in there added another handler each time the monitor was redrawn.
    this.grid.on("tap", () => {
      if (!this.lastMemory) return;
      this.events.dispatch("copy", { content: this.getHexDump(this.lastMemory) });
    });
  }

  public update(memory: Memory): void {
    this.lastMemory = memory;

    const { start, length } = this._options;
    const end = start + length - 1;

    // Check if range is valid
    if (isNaN(start) || isNaN(length) || start < 0 || length <= 0 || end > 0xffff) {
      this.showError();
      return;
    }

    // The debugger refreshes several times a second while a program runs. Rebuilding
    // every label each time churned hundreds of views per refresh and froze the main
    // thread on slow devices, so the grid is built once per range and refreshes only
    // touch the bytes whose value changed.
    if (this.builtStart !== start || this.builtLength !== length) {
      this.build(start, length);
    }

    for (let i = 0; i < length; i++) {
      const value = memory.get(start + i) ?? 0;
      if (this.values[i] === value) continue;
      this.values[i] = value;
      this.byteLabels[i].text = num2hex(value);
    }
  }

  private showError(): void {
    this.grid.removeChildren();
    this.byteLabels = [];
    this.values = [];
    this.builtStart = -1;
    this.builtLength = -1;

    this.grid.rows = "auto";
    const errorLabel = new Label();
    errorLabel.text = "Cannot monitor this range. Valid ranges are between $0000 and $ffff.";
    errorLabel.className = "text-sm text-error p-4";
    errorLabel.textWrap = true;
    errorLabel.row = 0;
    errorLabel.col = 0;
    errorLabel.colSpan = BYTES_PER_ROW + 1;
    this.grid.addChild(errorLabel);
  }

  private build(start: number, length: number): void {
    this.grid.removeChildren();
    this.byteLabels = [];
    this.values = [];

    // A GridLayout with no row specs has a single implicit row, so every label
    // would be clamped into it and stack on top of the first one.
    this.grid.rows = autoTrack(Math.ceil(length / BYTES_PER_ROW));

    for (let offset = 0; offset < length; offset += BYTES_PER_ROW) {
      const row = offset / BYTES_PER_ROW;

      const addrLabel = new Label();
      addrLabel.text = "$" + addr2hex(start + offset);
      addrLabel.className = "text-xs font-mono text-on-surface-variant mr-2";
      addrLabel.row = row;
      addrLabel.col = 0;
      this.grid.addChild(addrLabel);

      for (let i = 0; i < BYTES_PER_ROW && offset + i < length; i++) {
        const byteLabel = new Label();
        byteLabel.className = "text-xs font-mono text-on-surface mx-1";
        byteLabel.row = row;
        byteLabel.col = i + 1;
        this.grid.addChild(byteLabel);
        this.byteLabels.push(byteLabel);
        // Unset until `update` writes the first value, so every byte gets a text.
        this.values.push(-1);
      }
    }

    this.builtStart = start;
    this.builtLength = length;
  }

  private getHexDump(memory: Memory): string {
    const { start, length } = this._options;

    return memory.format({
      start,
      length,
      includeAddress: true,
      includeSpaces: true,
      includeNewline: true,
    });
  }
}
