import GObject from "gi://GObject";
import Adw from "gi://Adw";
import type Gtk from "gi://Gtk";

import Template from "./theme-selector.blp";
import { themeService } from "../services";

/**
 * ThemeSelector
 *
 * GNOME (Adwaita) widget to select the current theme mode (follow/light/dark)
 * and the primary color policy (none or a predefined color family).
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
  // Primary color buttons
  declare private _primary_none: Gtk.CheckButton;
  declare private _primary_blue: Gtk.CheckButton;
  declare private _primary_teal: Gtk.CheckButton;
  declare private _primary_green: Gtk.CheckButton;
  declare private _primary_yellow: Gtk.CheckButton;
  declare private _primary_orange: Gtk.CheckButton;
  declare private _primary_red: Gtk.CheckButton;
  declare private _primary_pink: Gtk.CheckButton;
  declare private _primary_purple: Gtk.CheckButton;
  declare private _primary_slate: Gtk.CheckButton;
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
          "primary_none",
          "primary_blue",
          "primary_teal",
          "primary_green",
          "primary_yellow",
          "primary_orange",
          "primary_red",
          "primary_pink",
          "primary_purple",
          "primary_slate",
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

    // Reflect primary state from service whenever it changes (including initial load)
    themeService.events.on("primary-changed", ({ key, mode }) => {
      const sel = key ?? (mode === "none" ? "none" : null);
      this._setPrimarySelection(sel as any);
    });

    // When the widget becomes visible/mapped, sync from the current service state
    this.connect("map", () => {
      console.log("map");
      const { key, mode } = themeService.getPrimaryState();
      const sel = key ?? (mode === "none" ? "none" : null);
      this._setPrimarySelection(sel as any);
    });

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

  // Primary color handlers
  /** Use blue primary family. */
  _onPrimaryBlueToggled(): void {
    this._onPrimaryToggled(this._primary_blue, "blue");
  }
  /** Use teal primary family. */
  _onPrimaryTealToggled(): void {
    this._onPrimaryToggled(this._primary_teal, "teal");
  }
  /** Use green primary family. */
  _onPrimaryGreenToggled(): void {
    this._onPrimaryToggled(this._primary_green, "green");
  }
  /** Use yellow primary family. */
  _onPrimaryYellowToggled(): void {
    this._onPrimaryToggled(this._primary_yellow, "yellow");
  }
  /** Use orange primary family. */
  _onPrimaryOrangeToggled(): void {
    this._onPrimaryToggled(this._primary_orange, "orange");
  }
  /** Use red primary family. */
  _onPrimaryRedToggled(): void {
    this._onPrimaryToggled(this._primary_red, "red");
  }
  /** Use pink primary family. */
  _onPrimaryPinkToggled(): void {
    this._onPrimaryToggled(this._primary_pink, "pink");
  }
  /** Use purple primary family. */
  _onPrimaryPurpleToggled(): void {
    this._onPrimaryToggled(this._primary_purple, "purple");
  }
  /** Use slate primary family. */
  _onPrimarySlateToggled(): void {
    this._onPrimaryToggled(this._primary_slate, "slate");
  }

  /**
   * No primary override (none). Clears explicit primary and marks class as none.
   */
  _onPrimaryNoneToggled(): void {
    if (this._isUpdatingUi) return;
    if (this._primary_none.get_active()) {
      // None: no primary class, also clear custom primary
      this._setPrimarySelection("none");
      themeService.setPrimaryNone();
      themeService.refreshThemedWidgets();
    }
  }

  /**
   * Common handler to toggle one primary family and ensure exclusivity.
   * @param source The toggled check button
   * @param key    The primary key (e.g., "blue", "teal")
   */
  private _onPrimaryToggled(source: Gtk.CheckButton, key: string): void {
    if (this._isUpdatingUi) return;
    if (!source.get_active()) {
      // If toggled off, clear primary only if no other is selected
      if (!this._anyPrimaryActive()) themeService.clearPrimaryColor();
      return;
    }

    // Ensure exclusivity among primaries
    this._setPrimarySelection(key);
    // Use predefined CSS variables by key instead of hex
    themeService.setPrimaryByKey(key as any);
    themeService.refreshThemedWidgets();
  }

  /**
   * Programmatically set which primary control is active, keeping exclusivity.
   * @param key Active primary key or policy ("none" | family key | null)
   */
  private _setPrimarySelection(key: string | null): void {
    this._isUpdatingUi = true;
    try {
      const map: Record<string, Gtk.CheckButton> = {
        none: this._primary_none,
        blue: this._primary_blue,
        teal: this._primary_teal,
        green: this._primary_green,
        yellow: this._primary_yellow,
        orange: this._primary_orange,
        red: this._primary_red,
        pink: this._primary_pink,
        purple: this._primary_purple,
        slate: this._primary_slate,
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
   * Returns true when any primary control is active.
   */
  private _anyPrimaryActive(): boolean {
    return (
      this._primary_none.get_active() ||
      this._primary_blue.get_active() ||
      this._primary_teal.get_active() ||
      this._primary_green.get_active() ||
      this._primary_yellow.get_active() ||
      this._primary_orange.get_active() ||
      this._primary_red.get_active() ||
      this._primary_pink.get_active() ||
      this._primary_purple.get_active() ||
      this._primary_slate.get_active()
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
