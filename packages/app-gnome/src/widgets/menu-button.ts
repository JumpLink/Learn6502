import GObject from "gi://GObject";
import Adw from "gi://Adw";

import Template from "./menu-button.blp";

export class MenuButton extends Adw.Bin {
  static {
    GObject.registerClass(
      {
        GTypeName: "MenuButton",
        Template,
        CssName: "menu-button",
      },
      this
    );
  }

  constructor(params = {}) {
    super(params);
  }
}

GObject.type_ensure(MenuButton.$gtype);
