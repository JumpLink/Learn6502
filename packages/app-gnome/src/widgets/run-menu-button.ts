import GObject from "gi://GObject";
import Adw from "gi://Adw";

import Template from "./run-menu-button.blp";

export class RunMenuButton extends Adw.Bin {
  static {
    GObject.registerClass(
      {
        GTypeName: "RunMenuButton",
        Template,
        CssName: "run-menu-button",
      },
      this
    );
  }

  constructor(params = {}) {
    super(params);
  }
}

GObject.type_ensure(RunMenuButton.$gtype);
