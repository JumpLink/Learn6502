import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

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
  }
}

GObject.type_ensure(Toolbar.$gtype);
