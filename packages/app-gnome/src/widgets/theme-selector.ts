// Adapted from https://github.com/sonnyp/troll/blob/8b0275948eedec9ed0378f9bdda1aa4aac3062ba/src/widgets/README.md

import GObject from "gi://GObject";
import Gtk from "gi://Gtk";
import Adw from "gi://Adw";

import Template from "./theme-selector.blp";

export class ThemeSelector extends Adw.Bin {
  declare private _follow: Gtk.CheckButton;

  private _theme: string;
  private style_manager: Adw.StyleManager;

  static {
    GObject.registerClass({
      GTypeName: "ThemeSelector",
      Template,
      CssName: "themeselector",
      InternalChildren: ["follow"],
      Properties: {
        theme: GObject.ParamSpec.string(
          "theme", // Name
          "Theme", // Nick
          "Theme", // Blurb
          GObject.ParamFlags.READWRITE,
          ""
        ),
      },
    }, this);
  }

  get theme(): string {
    return this._theme;
  }

  set theme(value: string) {
    this._theme = value;
  }

  constructor(params = {}) {
    super(params);

    this.style_manager = Adw.StyleManager.get_default();
    this.style_manager.connect(
      "notify::system-supports-color-schemes",
      this._on_notify_system_supports_color_schemes.bind(this),
    );
    this._on_notify_system_supports_color_schemes();

    const dark = this.style_manager.get_dark();
    this._theme = dark ? "dark" : "light";

    this.style_manager.connect("notify::dark", this._on_notify_dark.bind(this));
    this._on_notify_dark();
  }

  _on_notify_system_supports_color_schemes() {
    this._follow.set_visible(this.style_manager.get_system_supports_color_schemes());
  }

  _on_notify_dark() {
    if (this.style_manager.get_dark()) this.add_css_class("dark");
    else this.remove_css_class("dark");
  }
}

GObject.type_ensure(ThemeSelector.$gtype)