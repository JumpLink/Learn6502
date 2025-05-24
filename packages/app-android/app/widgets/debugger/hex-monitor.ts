import { GridLayout, Label, ScrollView } from "@nativescript/core";
import type {
  HexMonitorWidget,
  HexMonitorOptions,
  MemoryRegion,
  HexMonitorEventMap,
} from "@learn6502/common-ui";
import { memoryRegions } from "@learn6502/common-ui";
import type { Memory } from "@learn6502/6502";
import { EventDispatcher, num2hex, addr2hex } from "@learn6502/6502";

export class HexMonitor extends ScrollView implements HexMonitorWidget {
  readonly events = new EventDispatcher<HexMonitorEventMap>();

  private grid: GridLayout | null = null;
  private labels: Map<string, Label> = new Map();

  readonly memoryRegions: MemoryRegion[] = memoryRegions;

  private _options: HexMonitorOptions = {
    start: 0x0600, // Default to Program Storage
    length: 0x9a00,
  };

  get options(): HexMonitorOptions {
    return this._options;
  }

  set options(value: HexMonitorOptions) {
    this._options = value;
    this.events.dispatch("changed", undefined);
  }

  constructor() {
    super();
  }

  public onLoaded(): void {
    super.onLoaded();

    // Get reference to grid from template
    this.grid = this.getViewById<GridLayout>("grid");
    if (this.grid) {
      this.setupGrid();
    }
  }

  private setupGrid(): void {
    if (!this.grid) return;

    // Use 16 bytes per row as default
    const bytesPerRow = 16;

    this.grid.columns = "auto";
    for (let i = 0; i < bytesPerRow; i++) {
      this.grid.columns += ",auto";
    }
  }

  public update(memory: Memory): void {
    if (!this.grid) {
      console.error("HexMonitor: Grid not initialized");
      return;
    }

    this.grid.removeChildren();
    this.labels.clear();

    const { start, length } = this._options;
    const end = start + length - 1;
    const bytesPerRow = 16;
    let currentRow = 0;

    // Check if range is valid
    if (
      isNaN(start) ||
      isNaN(length) ||
      start < 0 ||
      length <= 0 ||
      end > 0xffff
    ) {
      const errorLabel = new Label();
      errorLabel.text =
        "Cannot monitor this range. Valid ranges are between $0000 and $ffff.";
      errorLabel.className = "text-sm text-error p-4";
      errorLabel.textWrap = true;
      errorLabel.row = 0;
      errorLabel.col = 0;
      errorLabel.colSpan = bytesPerRow + 1;
      this.grid.addChild(errorLabel);
      return;
    }

    for (let addr = start; addr <= end && addr <= 0xffff; addr += bytesPerRow) {
      // Address label
      const addrLabel = new Label();
      addrLabel.text = "$" + addr2hex(addr);
      addrLabel.className = "text-xs font-mono text-on-surface-variant mr-2";
      addrLabel.row = currentRow;
      addrLabel.col = 0;
      this.grid.addChild(addrLabel);

      // Memory bytes
      for (
        let i = 0;
        i < bytesPerRow && addr + i <= end && addr + i <= 0xffff;
        i++
      ) {
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

    // Add tap gesture for copying
    this.grid.on("tap", () => {
      const content = this.getHexDump(memory);
      this.events.dispatch("copy", { content });
    });
  }

  private getHexDump(memory: Memory): string {
    const { start, length } = this._options;

    // Find the current region name
    const region = this.memoryRegions.find(
      (r) => r.start === start && r.length === length
    );
    const regionName = region ? region.name : `Custom Range`;

    return memory.format({
      start,
      length,
      includeAddress: true,
      includeSpaces: true,
      includeNewline: true,
    });
  }
}
