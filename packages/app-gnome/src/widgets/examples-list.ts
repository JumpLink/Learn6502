import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import * as Examples from "@learn6502/examples/examples";
import type { ExampleMeta } from "@learn6502/examples";
import { ExampleListItem } from "./example-list-item.ts";

import Template from "./examples-list.blp";

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
export namespace ExamplesList {
  export interface SignalSignatures extends Gtk.Box.SignalSignatures {
    "copy-code": (code: string) => void;
  }
}

export interface ExamplesList {
  $signals: ExamplesList.SignalSignatures;
  connect<K extends keyof ExamplesList.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, ExamplesList.SignalSignatures[K]>
  ): number;
  connect_after<K extends keyof ExamplesList.SignalSignatures>(
    signal: K,
    callback: GObject.SignalCallback<this, ExamplesList.SignalSignatures[K]>
  ): number;
  emit<K extends keyof ExamplesList.SignalSignatures>(
    signal: K,
    ...args: GObject.GjsParameters<ExamplesList.SignalSignatures[K]>
  ): void;
}

export class ExamplesList extends Gtk.Box {
  private examples: ExampleMeta[] = Object.values(Examples);

  static {
    GObject.registerClass(
      {
        GTypeName: "ExamplesList",
        Template,
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
    this.populateExamples();
  }

  private populateExamples(): void {
    for (const example of this.examples) {
      const exampleWidget = this.createExampleWidget(example);
      this.append(exampleWidget);
    }
  }

  private createExampleWidget(example: ExampleMeta): ExampleListItem {
    const widget = new ExampleListItem();
    widget.setExample(example);

    // Forward copy-code signal
    widget.connect("copy-code", (_widget, code) => {
      this.emit("copy-code", code);
    });

    return widget;
  }
}

GObject.type_ensure(ExamplesList.$gtype);
