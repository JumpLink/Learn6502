import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import { QuickHelpView } from "../mdx/quick-help-view.ts";

import Template from "./help.window.blp";

export class HelpWindow extends Adw.Window {
  declare private _quickHelpView: QuickHelpView;

  static {
    GObject.registerClass(
      {
        GTypeName: "HelpWindow",
        Template,
        InternalChildren: ["quickHelpView"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Window.ConstructorProps> = {}) {
    super(params);
  }
}

GObject.type_ensure(HelpWindow.$gtype);
