import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import Template from "./toolbar.blp";

export class Toolbar extends Adw.Bin {
  static {
    GObject.registerClass(
      {
        GTypeName: "Toolbar",
        Template,
        CssName: "toolbar",
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    // The toolbar floats over source code, which is inherently LTR content
    // (it always starts at the left edge). Exempt it from RTL mirroring so
    // "halign: end" keeps anchoring it over the mostly empty right side
    // instead of covering the code.
    this.set_direction(Gtk.TextDirection.LTR);
  }
}

GObject.type_ensure(Toolbar.$gtype);
