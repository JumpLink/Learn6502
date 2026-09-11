import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import type { ExampleMeta } from "@learn6502/examples";
import { Memory, DisplayAddressRange } from "@learn6502/core";
import type { SourceView } from "./source-view.ts";
import type { Display } from "./game-console/display.ts";

import Template from "./example-list-item.blp";

/**
 * The signals this widget registers, on top of Gtk.Box's.
 *
 * @girs 5.0.0 keys `connect`, `connect_after` and `emit` to a per-class
 * `SignalSignatures` map. A subclass that registers its own signals is not in
 * its parent's map, so `connect("…")` is rejected by name and the callback's
 * parameters degrade to implicit `any` — two errors from one cause.
 *
 * Declaration merging rather than overriding the inherited methods: it ADDS
 * overloads beside the ones Gtk.Box already has, so both the inherited
 * signals and these resolve, and nothing needs an `any` escape hatch.
 */
export namespace ExampleListItem {
  export interface SignalSignatures extends Gtk.Box.SignalSignatures {
    "copy-code": (code: string) => void;
  }
}

export interface ExampleListItem {
  $signals: ExampleListItem.SignalSignatures;
  connect<K extends keyof ExampleListItem.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, ExampleListItem.SignalSignatures[K]>
  ): number;
  connect_after<K extends keyof ExampleListItem.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, ExampleListItem.SignalSignatures[K]>
  ): number;
  emit<K extends keyof ExampleListItem.SignalSignatures>(
    signal: K,
    ...args: GObject.GjsParameters<ExampleListItem.SignalSignatures[K]>
  ): void;
}

export class ExampleListItem extends Gtk.Box {
  declare private _titleLabel: Gtk.Label;
  declare private _authorLabel: Gtk.Label;
  declare private _descriptionLabel: Gtk.Label;
  declare private _display: Display;
  declare private _sourceView: SourceView;

  private _example: ExampleMeta | null = null;
  private _memory: Memory | null = null;

  static {
    GObject.registerClass(
      {
        GTypeName: "ExampleListItem",
        Template,
        InternalChildren: ["titleLabel", "authorLabel", "descriptionLabel", "display", "sourceView"],
        Signals: {
          "copy-code": {
            param_types: [GObject.TYPE_STRING],
          },
        },
      },
      this
    );
  }

  constructor(params?: Partial<Gtk.Box.ConstructorProps>) {
    super(params);
    this.setupSignalListeners();
  }

  private setupSignalListeners(): void {
    // Copy button from SourceView
    this._sourceView.events.on("copy", (event) => {
      this.emit("copy-code", event.code);
    });
  }

  public setExample(example: ExampleMeta): void {
    this._example = example;
    this._titleLabel.label = _(example.title);
    // TRANSLATORS: Example author for the Snake game
    this._authorLabel.label = _("by %s").format(example.author);
    this._descriptionLabel.label = _(example.description);
    this._sourceView.code = example.code;

    // Initialize display with example's memory snapshot
    this.initializeDisplay(example.displayMemory);
  }

  /**
   * Initialize the display with memory data from hex string
   * @param displayMemoryHex Hex string representing display memory
   */
  private initializeDisplay(displayMemoryHex: string): void {
    // Create a new memory instance
    this._memory = new Memory();

    // Parse the hex string and populate memory
    // Each 2 characters represent one byte
    let addr = DisplayAddressRange.START;
    for (let i = 0; i < displayMemoryHex.length; i += 2) {
      if (addr > DisplayAddressRange.END) {
        break;
      }
      const hexByte = displayMemoryHex.substring(i, i + 2);
      const value = parseInt(hexByte, 16);
      if (!isNaN(value)) {
        this._memory.set(addr, value);
        addr++;
      }
    }

    // Initialize the display widget with the memory
    this._display.initialize(this._memory);
  }

  public get example(): ExampleMeta | null {
    return this._example;
  }
}

GObject.type_ensure(ExampleListItem.$gtype);
