import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import type Gio from "@girs/gio-2.0";

import { ThemeService as BaseThemeService } from "../services/index.ts";
import { type ThemeMode } from "../types/index.ts";
import {
  KEY_COLOR_SCHEME,
  KEY_PRIMARY_COLOR,
  KEY_ACCENT_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_COLOR_SCHEME_OVERRIDE,
  DEFAULT_PRIMARY_OVERRIDE_KEY,
  DEFAULT_ACCENT_OVERRIDE_KEY,
  ColorScheme,
  PRIMARY_FAMILIES,
  isPrimaryFamilyKey,
  type PrimaryFamilyKey,
} from "./theme.ts";

/** The part of `Gio.Settings` the theme is stored through. */
export type ThemeSettings = Pick<Gio.Settings, "get_int" | "set_int" | "get_string" | "set_string" | "connect">;

/**
 * ThemeService on top of Adw.StyleManager.
 *
 * - Applies color scheme via Adw.StyleManager
 * - Persists preferences in the settings given to {@link init}, or keeps them in memory
 * - Exposes primary/accent overrides using CSS variables
 * - Adds helper CSS classes to registered widgets for easy styling hooks
 */
class ThemeService extends BaseThemeService {
  private styleManager: Adw.StyleManager | null = null;
  private settings: ThemeSettings | null = null;
  private variablesProvider: Gtk.CssProvider | null = null;
  /** Widgets that should automatically receive theme-related CSS classes. */
  private themedWidgets: Set<Gtk.Widget> = new Set();
  /** Named primary color key when using predefined color families. */
  private currentPrimaryKey: PrimaryFamilyKey | typeof DEFAULT_PRIMARY_COLOR = DEFAULT_PRIMARY_COLOR;
  /** Named accent color key when using predefined color families. */
  private currentAccentKey: PrimaryFamilyKey | typeof DEFAULT_ACCENT_COLOR = DEFAULT_ACCENT_COLOR;

  public init(settings?: ThemeSettings): void {
    if (this.styleManager) return;

    // Get the StyleManager singleton
    this.styleManager = Adw.StyleManager.get_default();

    if (settings) {
      this.settings = settings;
      // Monitor settings changes
      settings.connect(`changed::${KEY_COLOR_SCHEME}`, () => this.loadThemeFromSettings());
      settings.connect(`changed::${KEY_PRIMARY_COLOR}`, () => this.loadPrimaryFromSettings());
      settings.connect(`changed::${KEY_ACCENT_COLOR}`, () => this.loadAccentFromSettings());
    }

    // Load initial settings
    this.loadThemeFromSettings();
    this.loadPrimaryFromSettings();
    this.loadAccentFromSettings();

    // Monitor system appearance changes
    this.monitorSystemAppearance();

    // Also notify whether the system supports color schemes (for UI visibility)
    const supports = this.styleManager.get_system_supports_color_schemes();
    this.events.dispatch("system-support-changed", { supported: supports });
    this.styleManager.connect("notify::system-supports-color-schemes", () => {
      this.events.dispatch("system-support-changed", {
        supported: this.styleManager?.get_system_supports_color_schemes() ?? false,
      });
    });

    // The StyleManager repaints the system accent itself; only the style hook follows high contrast
    this.styleManager.connect("notify::high-contrast", () => this.refreshThemedWidgets());

    // Sync classes on theme/primary/accent changes
    this.events.on("theme-changed", () => this.refreshThemedWidgets());
    this.events.on("primary-changed", () => this.refreshThemedWidgets());
    this.events.on("accent-changed", () => this.refreshThemedWidgets());
  }

  private clearVariablesCssProvider(): void {
    const display = Gdk.Display.get_default();
    if (!display) return;
    if (this.variablesProvider) {
      Gtk.StyleContext.remove_provider_for_display(display, this.variablesProvider);
      this.variablesProvider = null;
    }
  }

  private updateVariablesCssProviderFromCss(css: string): void {
    const display = Gdk.Display.get_default();
    if (!display) return;
    if (!css.trim()) {
      this.clearVariablesCssProvider();
      return;
    }
    if (!this.variablesProvider) {
      this.variablesProvider = new Gtk.CssProvider();
      Gtk.StyleContext.add_provider_for_display(
        display,
        this.variablesProvider,
        Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
      );
    }
    this.variablesProvider.load_from_string(css);
  }

  private applyVariables(): void {
    const parts: string[] = [];
    if (this.currentAccentKey !== DEFAULT_ACCENT_COLOR) {
      parts.push(`--learn-accent-color: var(--accent-${this.currentAccentKey});`);
    }
    if (this.currentPrimaryKey !== DEFAULT_PRIMARY_COLOR) {
      parts.push(`--learn-primary-color: var(--accent-${this.currentPrimaryKey});`);
    }

    const css = parts.length ? `:root { ${parts.join(" ")} }` : "";
    this.updateVariablesCssProviderFromCss(css);
  }

  public get isHighContrast(): boolean {
    return this.styleManager?.get_high_contrast() || false;
  }

  protected isCurrentlyDarkTheme(): boolean {
    return this.styleManager?.get_dark() || false;
  }

  public get isDarkTheme(): boolean {
    return this.isCurrentlyDarkTheme();
  }

  protected applyTheme(mode: ThemeMode): void {
    switch (mode) {
      case "light":
        this.styleManager?.set_color_scheme(Adw.ColorScheme.FORCE_LIGHT);
        break;
      case "dark":
        this.styleManager?.set_color_scheme(Adw.ColorScheme.FORCE_DARK);
        break;
      case "system":
      default:
        this.styleManager?.set_color_scheme(Adw.ColorScheme.DEFAULT);
        break;
    }
    this.saveThemeToSettings(mode);
  }

  public setPrimaryByKey(key: PrimaryFamilyKey): void {
    if (this.currentPrimaryKey === key) return;
    this.currentPrimaryKey = key;
    this.applyVariables();
    this.savePrimaryToSettings(key);
    this.events.dispatch("primary-changed", {
      color: null,
      key,
      mode: "custom",
    });
  }

  public setPrimaryNone(persist: boolean = true): void {
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR) return;
    this.currentPrimaryKey = DEFAULT_PRIMARY_COLOR;
    this.applyVariables();
    if (persist) this.savePrimaryToSettings(DEFAULT_PRIMARY_COLOR);
    this.events.dispatch("primary-changed", {
      color: null,
      key: null,
      mode: "none",
    });
  }

  public setPrimaryDefault(persist: boolean = true): void {
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_OVERRIDE_KEY) return;
    this.currentPrimaryKey = DEFAULT_PRIMARY_OVERRIDE_KEY;
    this.applyVariables();
    if (persist) this.savePrimaryToSettings(DEFAULT_PRIMARY_OVERRIDE_KEY);
    this.events.dispatch("primary-changed", {
      color: null,
      key: DEFAULT_PRIMARY_OVERRIDE_KEY,
      mode: "custom",
    });
  }

  public setAccentByKey(key: PrimaryFamilyKey): void {
    if (this.currentAccentKey === key) return;
    this.currentAccentKey = key;
    this.applyVariables();
    this.saveAccentToSettings(key);
    this.events.dispatch("accent-changed", {
      key,
      mode: "custom",
    });
  }

  public setAccentSystem(persist: boolean = true): void {
    if (this.currentAccentKey === DEFAULT_ACCENT_COLOR) return;
    this.currentAccentKey = DEFAULT_ACCENT_COLOR;
    this.applyVariables();
    if (persist) this.saveAccentToSettings(DEFAULT_ACCENT_COLOR);
    this.events.dispatch("accent-changed", {
      key: null,
      mode: "system",
    });
  }

  private saveAccentToSettings(value: string): void {
    if (!this.settings) return;
    const current = this.settings.get_string(KEY_ACCENT_COLOR);
    if (current !== value) this.settings.set_string(KEY_ACCENT_COLOR, value);
  }

  private loadAccentFromSettings(): void {
    const stored = this.settings?.get_string(KEY_ACCENT_COLOR) ?? null;
    const value = stored || DEFAULT_ACCENT_OVERRIDE_KEY;

    if (!isPrimaryFamilyKey(value)) {
      this.setAccentSystem(false);
      return;
    }

    if (this.currentAccentKey !== value) {
      this.currentAccentKey = value;
      this.applyVariables();
      this.events.dispatch("accent-changed", {
        key: value,
        mode: "custom",
      });
    }
  }

  public getAccentState(): { key: PrimaryFamilyKey | null; mode: "system" | "custom" } {
    if (this.currentAccentKey === DEFAULT_ACCENT_COLOR) return { key: null, mode: "system" };
    return { key: this.currentAccentKey, mode: "custom" };
  }

  private savePrimaryToSettings(value: string): void {
    if (!this.settings) return;
    const current = this.settings.get_string(KEY_PRIMARY_COLOR);
    if (current !== value) this.settings.set_string(KEY_PRIMARY_COLOR, value);
  }

  private loadPrimaryFromSettings(): void {
    const stored = this.settings?.get_string(KEY_PRIMARY_COLOR) ?? null;
    const value = stored || DEFAULT_PRIMARY_COLOR;

    if (!isPrimaryFamilyKey(value)) {
      this.setPrimaryDefault(false);
      return;
    }

    this.currentPrimaryKey = value;
    this.applyVariables();
    this.events.dispatch("primary-changed", {
      color: null,
      key: value,
      mode: "custom",
    });
  }

  public getPrimaryState(): { key: PrimaryFamilyKey | null; mode: "none" | "custom" } {
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR) return { key: null, mode: "none" };
    return { key: this.currentPrimaryKey, mode: "custom" };
  }

  public registerThemedWidget(widget: Gtk.Widget): void {
    this.themedWidgets.add(widget);
    this.applyClasses(widget);
  }

  public unregisterThemedWidget(widget: Gtk.Widget): void {
    if (this.themedWidgets.delete(widget)) {
      this.clearClasses(widget);
    }
  }

  public refreshThemedWidgets(): void {
    for (const w of this.themedWidgets) this.applyClasses(w);
  }

  private applyClasses(widget: Gtk.Widget): void {
    this.clearClasses(widget);
    widget.add_css_class(`mode-${this.currentTheme}`);
    widget.add_css_class(this.isDarkTheme ? "is-dark" : "is-light");
    if (this.isHighContrast) widget.add_css_class("is-high-contrast");
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR) {
      widget.add_css_class("primary-none");
    } else {
      widget.add_css_class("primary-custom");
      widget.add_css_class(`primary-${this.currentPrimaryKey}`);
    }
    if (this.currentAccentKey !== DEFAULT_ACCENT_COLOR) {
      widget.add_css_class("accent-custom");
    }
  }

  private clearClasses(widget: Gtk.Widget): void {
    widget.remove_css_class("mode-system");
    widget.remove_css_class("mode-light");
    widget.remove_css_class("mode-dark");
    widget.remove_css_class("is-dark");
    widget.remove_css_class("is-light");
    widget.remove_css_class("is-high-contrast");
    widget.remove_css_class("primary-custom");
    widget.remove_css_class("primary-none");
    for (const family of PRIMARY_FAMILIES) {
      widget.remove_css_class(`primary-${family}`);
    }
    widget.remove_css_class("accent-custom");
  }

  private loadThemeFromSettings(): void {
    const saved = this.settings?.get_int(KEY_COLOR_SCHEME);
    const value = saved ?? DEFAULT_COLOR_SCHEME_OVERRIDE;
    this.setTheme(this.intToThemeMode(value));
  }

  private saveThemeToSettings(mode: ThemeMode): void {
    if (!this.settings) return;
    this.settings.set_int(KEY_COLOR_SCHEME, this.themeModeToInt(mode));
  }

  private themeModeToInt(mode: ThemeMode): ColorScheme {
    switch (mode) {
      case "light":
        return ColorScheme.LIGHT;
      case "dark":
        return ColorScheme.DARK;
      case "system":
      default:
        return ColorScheme.SYSTEM;
    }
  }

  private intToThemeMode(value: number | null | undefined): ThemeMode {
    switch (value ?? DEFAULT_COLOR_SCHEME) {
      case ColorScheme.LIGHT:
        return "light";
      case ColorScheme.DARK:
        return "dark";
      case ColorScheme.SYSTEM:
      default:
        return "system";
    }
  }

  private monitorSystemAppearance(): void {
    this.styleManager?.connect("notify::dark", () => {
      if (this._currentTheme === "system") {
        this._isDarkTheme = this.styleManager?.get_dark() || false;
        this.notifyThemeChanged();
      }
    });
  }

  public isSystemColorSchemeSupported(): boolean {
    return this.styleManager?.get_system_supports_color_schemes() ?? false;
  }
}

export const themeService = new ThemeService();
