import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { SourceView } from "../source-view.ts";

import { EventDispatcher, type Memory } from "@learn6502/6502";
import {
  type HexMonitorOptions,
  type HexMonitorWidget,
  type MemoryRegion,
  memoryRegions,
  type HexMonitorEventMap,
} from "@learn6502/common-ui";

import Template from "./hex-monitor.blp";

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
export class HexMonitor extends Adw.Bin implements HexMonitorWidget {
  readonly _events: EventDispatcher<HexMonitorEventMap> =
    new EventDispatcher<HexMonitorEventMap>();

  get events(): EventDispatcher<HexMonitorEventMap> {
    return this._events;
  }

  // Child widgets
  declare private _sourceView: SourceView;
  declare private _memoryRegionDropDown: Gtk.DropDown;

  // Signal handler IDs
  private _handlerIds: number[] = [];

  // Memory region definitions
  get memoryRegions(): MemoryRegion[] {
    return memoryRegions;
  }

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
    if (selectedIndex >= 0 && selectedIndex < this.memoryRegions.length) {
      const region = this.memoryRegions[selectedIndex];
      this.setMonitorRange(region.start, region.length);
      this.emit("changed"); // Deprecated
      this.events.dispatch("changed", {
        content: this._sourceView.code,
        region,
      });
    }
  }

  private onCopy(_sourceView: SourceView, content: string) {
    // Remove all whitespace
    content = content.replace(/\s/g, "");
    this.emit("copy", content); // Deprecated
    this.events.dispatch("copy", { content: content });
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
