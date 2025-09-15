import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./theme-mode-selector.blp";
import { themeService } from "../services";

/**
 * ThemeModeSelector
 *
 * Compact selector for application color scheme: follow system / light / dark.
 * Pure UI wiring; delegates changes to themeService.
 */
export class ThemeModeSelector extends Adw.Bin {
  declare private _follow: Gtk.CheckButton;
  declare private _light: Gtk.CheckButton;
  declare private _dark: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "ThemeModeSelector",
        Template,
        CssName: "theme-mode-selector",
        InternalChildren: ["follow", "light", "dark"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

    // Show follow if system color scheme is supported
    this._follow.set_visible(themeService.isSystemColorSchemeSupported());

    // Initialize selection
    this._setUiSelection(themeService.currentTheme);

    // React to theme and system support changes
    themeService.events.on("theme-changed", () => {
      this._setUiSelection(themeService.currentTheme);
    });
    themeService.events.on("system-support-changed", ({ supported }) => {
      this._follow.set_visible(supported);
    });
  }

  _onFollowToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._follow.get_active()) {
      this._setUiSelection("system");
      themeService.setColorScheme("system");
    }
  }

  _onLightToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._light.get_active()) {
      this._setUiSelection("light");
      themeService.setColorScheme("light");
    }
  }

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

GObject.type_ensure(ThemeModeSelector.$gtype);
