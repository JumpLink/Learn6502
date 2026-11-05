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
    // Register/unregister for theme classes so theme classes apply. `vfunc_map`/`vfunc_unmap`
    // are real GObject vfuncs the pure-JS engine (web, iOS) never dispatches — construction and
    // `close-request` fire identically on every engine, and a fresh HelpWindow is created and
    // presented on each use (main-window.services.ts), so they are an exact substitute here.
    themeService.registerThemedWidget(this);
    this.connect("close-request", () => {
      themeService.unregisterThemedWidget(this);
      return false;
    });
  }
}

GObject.type_ensure(HelpWindow.$gtype);
