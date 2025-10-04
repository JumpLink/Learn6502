import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import { snake } from "@learn6502/examples";
import type { ExampleMeta } from "@learn6502/examples/example-meta";
import { ExampleListItem } from "./example-list-item.ts";

import Template from "./examples-list.blp";

export class ExamplesList extends Gtk.Box {
  private examples: ExampleMeta[] = [snake];

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
