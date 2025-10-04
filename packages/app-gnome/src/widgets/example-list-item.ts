import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

import type { ExampleMeta } from "@learn6502/examples/example-meta";
import { SourceView } from "./source-view.ts";

import Template from "./example-list-item.blp";

export class ExampleListItem extends Gtk.Box {
  declare private _titleLabel: Gtk.Label;
  declare private _authorLabel: Gtk.Label;
  declare private _descriptionLabel: Gtk.Label;
  declare private _sourceView: SourceView;

  private _example: ExampleMeta | null = null;

  static {
    GObject.registerClass(
      {
        GTypeName: "ExampleListItem",
        Template,
        InternalChildren: [
          "titleLabel",
          "authorLabel",
          "descriptionLabel",
          "sourceView",
        ],
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
  }

  public get example(): ExampleMeta | null {
    return this._example;
  }
}

GObject.type_ensure(ExampleListItem.$gtype);
