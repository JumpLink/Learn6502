// Adapted from https://github.com/sonnyp/troll/blob/8b0275948eedec9ed0378f9bdda1aa4aac3062ba/src/widgets/README.md

import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./theme-selector.blp";
import { themeService } from "../services";

export class ThemeSelector extends Adw.Bin {
  declare private _follow: Gtk.CheckButton;
  declare private _light: Gtk.CheckButton;
  declare private _dark: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "ThemeSelector",
        Template,
        CssName: "theme-selector",
        InternalChildren: ["follow", "light", "dark"],
      },
      this
    );
  }

  constructor(params = {}) {
    super(params);

    // Follow/Light/Dark visibility based on system support
    this._follow.set_visible(themeService.isSystemColorSchemeSupported());

    // Initialize CheckButton states based on current theme
    this._setUiSelection(themeService.currentTheme);

    // React to theme changes
    themeService.events.on("theme-changed", ({ theme, isDark }) => {
      if (isDark) this.add_css_class("dark");
      else this.remove_css_class("dark");
      this._setUiSelection(themeService.currentTheme);
    });

    themeService.events.on("system-support-changed", ({ supported }) => {
      this._follow.set_visible(supported);
    });
  }

  /**
   * Handler for follow system style toggle.
   * Handler is registered in the template.
   */
  _onFollowToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._follow.get_active()) {
      // Optimistically reflect selection in UI to avoid double-click feel
      this._setUiSelection("system");
      themeService.setColorScheme("system");
    }
  }

  /**
   * Handler for light theme toggle.
   * Handler is registered in the template.
   */
  _onLightToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._light.get_active()) {
      this._setUiSelection("light");
      themeService.setColorScheme("light");
    }
  }

  /**
   * Handler for dark theme toggle.
   * Handler is registered in the template.
   */
  _onDarkToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._dark.get_active()) {
      this._setUiSelection("dark");
      themeService.setColorScheme("dark");
    }
  }

  private _setUiSelection(theme: "system" | "light" | "dark"): void {
    this._isUpdatingUi = true;
    try {
      const wantFollow = theme === "system";
      const wantLight = theme === "light";
      const wantDark = theme === "dark";

      if (this._follow.get_active() !== wantFollow)
        this._follow.set_active(wantFollow);
      if (this._light.get_active() !== wantLight)
        this._light.set_active(wantLight);
      if (this._dark.get_active() !== wantDark) this._dark.set_active(wantDark);
    } finally {
      this._isUpdatingUi = false;
    }
  }
}

GObject.type_ensure(ThemeSelector.$gtype);
