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

  private labels: Map<string, Label> = new Map();

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
    this.grid.removeChildren();
    this.labels.clear();

    const { start, length } = this._options;
    const end = start + length - 1;
    let currentRow = 0;

    // Check if range is valid
    if (isNaN(start) || isNaN(length) || start < 0 || length <= 0 || end > 0xffff) {
      this.grid.rows = "auto";
      const errorLabel = new Label();
      errorLabel.text = "Cannot monitor this range. Valid ranges are between $0000 and $ffff.";
      errorLabel.className = "text-sm text-error p-4";
      errorLabel.textWrap = true;
      errorLabel.row = 0;
      errorLabel.col = 0;
      errorLabel.colSpan = BYTES_PER_ROW + 1;
      this.grid.addChild(errorLabel);
      return;
    }

    // A GridLayout with no row specs has a single implicit row, so every label
    // would be clamped into it and stack on top of the first one.
    this.grid.rows = autoTrack(Math.ceil(length / BYTES_PER_ROW));

    for (let addr = start; addr <= end && addr <= 0xffff; addr += BYTES_PER_ROW) {
      // Address label
      const addrLabel = new Label();
      addrLabel.text = "$" + addr2hex(addr);
      addrLabel.className = "text-xs font-mono text-on-surface-variant mr-2";
      addrLabel.row = currentRow;
      addrLabel.col = 0;
      this.grid.addChild(addrLabel);

      // Memory bytes
      for (let i = 0; i < BYTES_PER_ROW && addr + i <= end && addr + i <= 0xffff; i++) {
        const byteLabel = new Label();
        const value = memory.get(addr + i);
        byteLabel.text = num2hex(value !== undefined ? value : 0);
        byteLabel.className = "text-xs font-mono text-on-surface mx-1";
        byteLabel.row = currentRow;
        byteLabel.col = i + 1;

        const key = `byte_${addr + i}`;
        this.labels.set(key, byteLabel);
        this.grid.addChild(byteLabel);
      }

      currentRow++;
    }
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
