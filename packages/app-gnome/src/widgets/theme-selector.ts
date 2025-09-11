// Adapted from https://github.com/sonnyp/troll/blob/8b0275948eedec9ed0378f9bdda1aa4aac3062ba/src/widgets/README.md

import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./theme-selector.blp";
import { themeService } from "../services";

/**
 * ThemeSelector
 *
 * GNOME (Adwaita) widget to select the current theme mode (follow/light/dark)
 * and the accent policy (auto/none or a predefined accent family).
 *
 * Responsibilities:
 * - Reflect current mode in three primary check buttons
 * - Provide a compact accent selector row
 * - Delegate state changes to themeService (platform logic)
 * - No persistence or business logic here; UI wiring only
 */
export class ThemeSelector extends Adw.Bin {
  declare private _follow: Gtk.CheckButton;
  declare private _light: Gtk.CheckButton;
  declare private _dark: Gtk.CheckButton;
  // Accent buttons
  declare private _accent_auto: Gtk.CheckButton;
  declare private _accent_none: Gtk.CheckButton;
  declare private _accent_blue: Gtk.CheckButton;
  declare private _accent_teal: Gtk.CheckButton;
  declare private _accent_green: Gtk.CheckButton;
  declare private _accent_yellow: Gtk.CheckButton;
  declare private _accent_orange: Gtk.CheckButton;
  declare private _accent_red: Gtk.CheckButton;
  declare private _accent_pink: Gtk.CheckButton;
  declare private _accent_purple: Gtk.CheckButton;
  declare private _accent_slate: Gtk.CheckButton;
  private _isUpdatingUi: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "ThemeSelector",
        Template,
        CssName: "theme-selector",
        InternalChildren: [
          "follow",
          "light",
          "dark",
          "accent_auto",
          "accent_none",
          "accent_blue",
          "accent_teal",
          "accent_green",
          "accent_yellow",
          "accent_orange",
          "accent_red",
          "accent_pink",
          "accent_purple",
          "accent_slate",
        ],
      },
      this
    );
  }

  /**
   * Create a ThemeSelector widget.
   * Binds visibility and selection to the current themeService state
   * and refreshes when the theme changes.
   */
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
      themeService.refreshThemedWidgets();
    });

    themeService.events.on("system-support-changed", ({ supported }) => {
      this._follow.set_visible(supported);
    });
  }

  /**
   * Select system-following color scheme.
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
   * Select light color scheme.
   */
  _onLightToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._light.get_active()) {
      this._setUiSelection("light");
      themeService.setColorScheme("light");
    }
  }

  /**
   * Select dark color scheme.
   */
  _onDarkToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._dark.get_active()) {
      this._setUiSelection("dark");
      themeService.setColorScheme("dark");
    }
  }

  // Accent handlers
  /** Use blue accent family. */
  _onAccentBlueToggled(): void {
    this._onAccentToggled(this._accent_blue, "blue");
  }
  /** Use teal accent family. */
  _onAccentTealToggled(): void {
    this._onAccentToggled(this._accent_teal, "teal");
  }
  /** Use green accent family. */
  _onAccentGreenToggled(): void {
    this._onAccentToggled(this._accent_green, "green");
  }
  /** Use yellow accent family. */
  _onAccentYellowToggled(): void {
    this._onAccentToggled(this._accent_yellow, "yellow");
  }
  /** Use orange accent family. */
  _onAccentOrangeToggled(): void {
    this._onAccentToggled(this._accent_orange, "orange");
  }
  /** Use red accent family. */
  _onAccentRedToggled(): void {
    this._onAccentToggled(this._accent_red, "red");
  }
  /** Use pink accent family. */
  _onAccentPinkToggled(): void {
    this._onAccentToggled(this._accent_pink, "pink");
  }
  /** Use purple accent family. */
  _onAccentPurpleToggled(): void {
    this._onAccentToggled(this._accent_purple, "purple");
  }
  /** Use slate accent family. */
  _onAccentSlateToggled(): void {
    this._onAccentToggled(this._accent_slate, "slate");
  }

  /**
   * Follow system accent (auto). Clears explicit accent.
   */
  _onAccentAutoToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._accent_auto.get_active()) {
      // Auto: remove custom accent and let system accent apply
      this._setAccentSelection("auto");
      themeService.setAccentAuto();
      themeService.refreshThemedWidgets();
    }
  }

  /**
   * No accent override (none). Clears explicit accent and marks class as none.
   */
  _onAccentNoneToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._accent_none.get_active()) {
      // None: no accent class, also clear custom accent
      this._setAccentSelection("none");
      themeService.setAccentNone();
      themeService.refreshThemedWidgets();
    }
  }

  /**
   * Common handler to toggle one accent family and ensure exclusivity.
   * @param source The toggled check button
   * @param key    The accent key (e.g., "blue", "teal")
   */
  private _onAccentToggled(source: Gtk.CheckButton, key: string): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      // If toggled off, clear accent only if no other is selected
      if (!this._anyAccentActive()) themeService.clearAccentColor();
      return;
    }

    // Ensure exclusivity among accents
    this._setAccentSelection(key);
    // Use predefined CSS variables by key instead of hex
    themeService.setAccentByKey(key as any);
    themeService.refreshThemedWidgets();
  }

  /**
   * Programmatically set which accent control is active, keeping exclusivity.
   * @param key Active accent key or policy ("auto" | "none" | family key | null)
   */
  private _setAccentSelection(key: string | null): void {
    this._isUpdatingUi = true;
    try {
      const map: Record<string, Gtk.CheckButton> = {
        auto: this._accent_auto,
        none: this._accent_none,
        blue: this._accent_blue,
        teal: this._accent_teal,
        green: this._accent_green,
        yellow: this._accent_yellow,
        orange: this._accent_orange,
        red: this._accent_red,
        pink: this._accent_pink,
        purple: this._accent_purple,
        slate: this._accent_slate,
      };
      for (const [k, btn] of Object.entries(map)) {
        const want = key === k;
        if (btn.get_active() !== want) btn.set_active(want);
      }
    } finally {
      this._isUpdatingUi = false;
    }
  }

  /**
   * Returns true when any accent control is active.
   */
  private _anyAccentActive(): boolean {
    return (
      this._accent_auto.get_active() ||
      this._accent_none.get_active() ||
      this._accent_blue.get_active() ||
      this._accent_teal.get_active() ||
      this._accent_green.get_active() ||
      this._accent_yellow.get_active() ||
      this._accent_orange.get_active() ||
      this._accent_red.get_active() ||
      this._accent_pink.get_active() ||
      this._accent_purple.get_active() ||
      this._accent_slate.get_active()
    );
  }

  /**
   * Reflect current theme mode in the three primary check buttons.
   */
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
