import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";
import { themeService } from "../preferences/theme.service.ts";

import Template from "./help-window.blp?template";

export class HelpWindow extends Adw.Window {
  declare private _quickHelpView: Gtk.Widget;

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

  // Register/unregister for theme classes so variables.css styles apply
  vfunc_map(): void {
    super.vfunc_map();
    themeService.registerThemedWidget(this);
  }

  vfunc_unmap(): void {
    themeService.unregisterThemedWidget(this);
    super.vfunc_unmap();
  }
}

GObject.type_ensure(HelpWindow.$gtype);
