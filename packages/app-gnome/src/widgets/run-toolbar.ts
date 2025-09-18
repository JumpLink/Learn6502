import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";

import Template from "./run-toolbar.blp";

export class RunToolbar extends Adw.Bin {
  static {
    GObject.registerClass(
      {
        GTypeName: "RunToolbar",
        Template,
        CssName: "run-toolbar",
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
  }
}

GObject.type_ensure(RunToolbar.$gtype);
