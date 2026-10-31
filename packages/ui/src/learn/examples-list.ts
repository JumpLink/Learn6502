import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import { EventDispatcher } from "@learn6502/core";
import type { LearnCopyEvent } from "@learn6502/common-ui";

import * as Examples from "@learn6502/examples/examples";
import type { ExampleMeta } from "@learn6502/examples";
import { ExampleListItem } from "./example-list-item.ts";

import Template from "./examples-list.blp?template";

/**
 * @emits copy - A card's code should be loaded into the editor
 */
export class ExamplesList extends Gtk.Box {
  readonly events = new EventDispatcher<{ copy: LearnCopyEvent }>();

  private examples: ExampleMeta[] = Object.values(Examples);
  private _populated = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "ExamplesList",
        Template,
      },
      this
    );
  }

  constructor(params: Partial<Gtk.Box.ConstructorProps> = {}) {
    super(params);
  }

  /** Build the cards. Idempotent, and left to the caller so that a page nobody opens costs nothing. */
  public populate(): void {
    if (this._populated) return;
    this._populated = true;
    for (const example of this.examples) {
      this.append(this.createExampleWidget(example));
    }
  }

  private createExampleWidget(example: ExampleMeta): ExampleListItem {
    const widget = new ExampleListItem();
    widget.setExample(example);
    widget.events.on("copy", (event) => this.events.dispatch("copy", event));
    return widget;
  }
}

GObject.type_ensure(ExamplesList.$gtype);
