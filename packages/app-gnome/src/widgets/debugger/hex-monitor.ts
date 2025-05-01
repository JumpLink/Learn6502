import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { SourceView } from "../source-view.ts";

import type {
  Memory,
  HexMonitorOptions,
  HexMonitor as HexMonitorInterface,
} from "@learn6502/6502";

import Template from "./hex-monitor.blp";

interface MemoryRegion {
  name: string;
  start: number;
  length: number;
}

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
export class HexMonitor extends Adw.Bin implements HexMonitorInterface {
  // Child widgets
  declare private _sourceView: SourceView;
  declare private _memoryRegionDropDown: Gtk.DropDown;

  // Signal handler IDs
  private _handlerIds: number[] = [];

  // Memory region definitions
  private _memoryRegions: MemoryRegion[] = [
    { name: "Zero Page ($0000-$00FF)", start: 0x0000, length: 0x0100 },
    { name: "Stack ($0100-$01FF)", start: 0x0100, length: 0x0100 },
    { name: "Display Memory ($0200-$05FF)", start: 0x0200, length: 0x0400 },
    { name: "Program Storage ($0600-$FFFF)", start: 0x0600, length: 0x9a00 },
    { name: "Snake Game Data ($00-$15)", start: 0x0000, length: 0x0016 },
    { name: "Random/Input ($FE-$FF)", start: 0x00fe, length: 0x0002 },
    { name: "Full Memory ($0000-$FFFF)", start: 0x0000, length: 0x10000 },
  ];

  static {
    GObject.registerClass(
      {
        GTypeName: "HexMonitor",
        Template,
        InternalChildren: ["sourceView", "memoryRegionDropDown"],
        Signals: {
          changed: {},
          copy: {
            param_types: [GObject.TYPE_STRING],
          },
        },
      },
      this
    );
  }

  public options: HexMonitorOptions = {
    start: 0x0,
    length: 0xff,
  };

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
    this.setupUI();
    this.connectSignals();

    this._sourceView.connect("copy", this.onCopy.bind(this));

    // Ensure signal handlers are disconnected when widget is finalized
    this.connect("destroy", this.disconnectSignals.bind(this));
  }

  private setupUI(): void {
    // Set initial selection to Zero Page
    this._memoryRegionDropDown.set_selected(0);
    this.applySelectedRegion();
  }

  private connectSignals(): void {
    // Connect to dropdown changed signal
    this._handlerIds.push(
      this._memoryRegionDropDown.connect(
        "notify::selected",
        this.onRegionChanged.bind(this)
      )
    );
  }

  private disconnectSignals(): void {
    // Disconnect all signal handlers
    try {
      this._handlerIds.forEach((id) => this.disconnect(id));
    } catch (error) {
      console.error("[HexMonitor] Failed to disconnect signal handlers", error);
    }
    this._handlerIds = [];
  }

  private onRegionChanged(): void {
    this.applySelectedRegion();
  }

  private applySelectedRegion(): void {
    const selectedIndex = this._memoryRegionDropDown.get_selected();
    if (selectedIndex >= 0 && selectedIndex < this._memoryRegions.length) {
      const region = this._memoryRegions[selectedIndex];
      this.setMonitorRange(region.start, region.length);
      this.emit("changed");
    }
  }

  private onCopy(_sourceView: SourceView, code: string) {
    // Remove all whitespace
    code = code.replace(/\s/g, "");
    this.emit("copy", code);
  }

  public update(memory: Memory) {
    let content = "";

    const end = this.options.start + this.options.length - 1;

    if (
      !isNaN(this.options.start) &&
      !isNaN(this.options.length) &&
      this.options.start >= 0 &&
      this.options.length > 0 &&
      end <= 0xffff
    ) {
      content = memory.format({
        start: this.options.start,
        length: this.options.length,
        includeAddress: false,
        includeSpaces: true,
        includeNewline: true,
      });
    } else {
      content =
        "Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.";
    }

    this._sourceView.code = content;
  }

  public setMonitorRange(start: number, length: number): void {
    this.options.start = start;
    this.options.length = length;
    this._sourceView.lineNumberStart = start;
  }

  public clear(): void {
    this._sourceView.lineNumberStart = 0;
    this._sourceView.code = "";
  }
}

GObject.type_ensure(HexMonitor.$gtype);
