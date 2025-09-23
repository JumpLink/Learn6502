import { ThemeService as BaseThemeService } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import Gio from "@girs/gio-2.0";
import mainCss from "../main.css?inline";
import {
  KEY_COLOR_SCHEME,
  KEY_PRIMARY_COLOR,
  KEY_ACCENT_COLOR,
  APPLICATION_ID,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_ACCENT_COLOR,
  PRIMARY_FAMILIES,
} from "../constants.ts";
import type { PrimaryFamilyKey } from "../types/theme.ts";

/**
 * GNOME-specific ThemeService implementation.
 *
 * - Applies color scheme via Adw.StyleManager
 * - Persists preferences in GSettings (schema: APPLICATION_ID)
 * - Exposes primary/accent overrides using CSS variables
 * - Adds helper CSS classes to registered widgets for easy styling hooks
 */
class ThemeService extends BaseThemeService {
  private styleManager: Adw.StyleManager | null = null;
  private settings: Gio.Settings | null = null;
  private cssProvider: Gtk.CssProvider | null = null;
  private variablesProvider: Gtk.CssProvider | null = null;
  /** Widgets that should automatically receive theme-related CSS classes. */
  private themedWidgets: Set<Gtk.Widget> = new Set();
  /** Named primary color key when using predefined color families. */
  private currentPrimaryKey: PrimaryFamilyKey | "none" | null =
    DEFAULT_PRIMARY_COLOR;
  private currentPrimaryHex: string | null = null;
  /** Named accent color key when using predefined color families. */
  private currentAccentKey: PrimaryFamilyKey | "system" = DEFAULT_ACCENT_COLOR;

  constructor() {
    super();
  }

  public init(): void {
    // Load application CSS once
    if (!this.cssProvider) {
      this.cssProvider = new Gtk.CssProvider();
      this.cssProvider.load_from_string(mainCss);
      const display = this.getDisplay();
      if (display) {
        Gtk.StyleContext.add_provider_for_display(
          display,
          this.cssProvider,
          Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
        );
      }
    }

    // Get the StyleManager singleton
    this.styleManager = Adw.StyleManager.get_default();

    // Initialize GSettings for theme settings
    this.settings = new Gio.Settings({ schema_id: APPLICATION_ID });
    // Monitor settings changes
    this.settings.connect(`changed::${KEY_COLOR_SCHEME}`, () =>
      this.loadThemeFromSettings()
    );
    this.settings.connect(`changed::${KEY_PRIMARY_COLOR}`, () =>
      this.loadPrimaryFromSettings()
    );
    this.settings.connect(`changed::${KEY_ACCENT_COLOR}`, () =>
      this.loadAccentFromSettings()
    );

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
        supported:
          this.styleManager?.get_system_supports_color_schemes() ?? false,
      });
    });

    // Sync classes on theme/primary/accent changes
    this.events.on("theme-changed", () => this.refreshThemedWidgets());
    this.events.on("primary-changed", () => this.refreshThemedWidgets());
    this.events.on("accent-changed", () => this.refreshThemedWidgets());

    // Default to none when unset
    if (!this.currentPrimaryKey) this.setPrimaryNone(false);
  }

  private clearVariablesCssProvider(): void {
    const display = this.getDisplay();
    if (!display) return;
    if (this.variablesProvider) {
      Gtk.StyleContext.remove_provider_for_display(
        display,
        this.variablesProvider
      );
      this.variablesProvider = null;
    }
  }

  private updateVariablesCssProviderFromCss(css: string): void {
    const display = this.getDisplay();
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
      parts.push(
        `--learn-accent-color: var(--accent-${this.currentAccentKey});`
      );
    }
    if (
      this.currentPrimaryKey &&
      this.currentPrimaryKey !== DEFAULT_PRIMARY_COLOR
    ) {
      parts.push(
        `--learn-primary-color: var(--accent-${this.currentPrimaryKey});`
      );
    } else if (!this.currentPrimaryKey && this.currentPrimaryHex) {
      parts.push(`--learn-primary-color: ${this.currentPrimaryHex};`);
    }

    const css = parts.length ? `:root { ${parts.join(" ")} }` : "";
    this.updateVariablesCssProviderFromCss(css);
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

  public setPrimaryColor(hexOrNull: string | null): void {
    if (!hexOrNull) {
      if (!this.currentPrimaryHex && this.currentPrimaryKey === null) return;
      this.currentPrimaryHex = null;
      this.currentPrimaryKey = null;
      this.applyVariables();
      this.events.dispatch("primary-changed", {
        color: null,
        key: null,
        mode: "none",
      });
      return;
    }

    if (this.currentPrimaryHex === hexOrNull && this.currentPrimaryKey === null)
      return;
    this.currentPrimaryHex = hexOrNull;
    this.currentPrimaryKey = null;
    this.applyVariables();
    this.events.dispatch("primary-changed", {
      color: hexOrNull,
      key: null,
      mode: "custom",
    });
  }

  public clearPrimaryColor(): void {
    this.setPrimaryColor(null);
  }

  public setPrimaryByKey(key: PrimaryFamilyKey): void {
    if (this.currentPrimaryKey === key && this.currentPrimaryHex === null)
      return;
    this.currentPrimaryHex = null;
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
    if (
      this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR &&
      this.currentPrimaryHex === null
    )
      return;
    this.currentPrimaryHex = null;
    this.currentPrimaryKey = DEFAULT_PRIMARY_COLOR;
    this.applyVariables();
    if (persist) this.savePrimaryToSettings(DEFAULT_PRIMARY_COLOR);
    this.events.dispatch("primary-changed", {
      color: null,
      key: null,
      mode: "none",
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
    const value = stored || DEFAULT_ACCENT_COLOR;

    if (value === DEFAULT_ACCENT_COLOR) {
      this.setAccentSystem(false);
      return;
    }

    if ((PRIMARY_FAMILIES as readonly string[]).includes(value)) {
      if (this.currentAccentKey !== (value as PrimaryFamilyKey)) {
        this.currentAccentKey = value as PrimaryFamilyKey;
        this.applyVariables();
        this.events.dispatch("accent-changed", {
          key: value as PrimaryFamilyKey,
          mode: "custom",
        });
      }
      return;
    }

    this.setAccentSystem(false);
  }

  public getAccentState(): { key: string | null; mode: "system" | "custom" } {
    if (this.currentAccentKey === DEFAULT_ACCENT_COLOR)
      return { key: null, mode: "system" };
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

    if (value === DEFAULT_PRIMARY_COLOR || value === "auto") {
      this.setPrimaryNone(false);
      return;
    }

    if ((PRIMARY_FAMILIES as readonly string[]).includes(value)) {
      this.currentPrimaryHex = null;
      this.currentPrimaryKey = value as PrimaryFamilyKey;
      this.applyVariables();
      this.events.dispatch("primary-changed", {
        color: null,
        key: value as PrimaryFamilyKey,
        mode: "custom",
      });
      return;
    }

    this.setPrimaryNone(false);
  }

  public getPrimaryState(): { key: string | null; mode: "none" | "custom" } {
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR) {
      return { key: null, mode: "none" };
    }
    if (this.currentPrimaryKey) {
      return { key: this.currentPrimaryKey, mode: "custom" };
    }
    if (this.currentPrimaryHex) {
      return { key: null, mode: "custom" };
    }
    return { key: null, mode: "none" };
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
    const mode = this.currentTheme;
    const isDark = this.isDarkTheme;
    widget.add_css_class(`mode-${mode}`);
    widget.add_css_class(isDark ? "is-dark" : "is-light");
    if (this.currentPrimaryKey === DEFAULT_PRIMARY_COLOR) {
      widget.add_css_class("primary-none");
    } else if (this.currentPrimaryKey || this.currentPrimaryHex) {
      widget.add_css_class("primary-custom");
      if (this.currentPrimaryKey)
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
    widget.remove_css_class("primary-custom");
    widget.remove_css_class("primary-none");
    for (const family of PRIMARY_FAMILIES) {
      widget.remove_css_class(`primary-${family}`);
    }
    widget.remove_css_class("accent-custom");
  }

  private loadThemeFromSettings(): void {
    const saved = this.settings?.get_int(KEY_COLOR_SCHEME);
    this.setTheme(this.intToThemeMode(saved));
  }

  private saveThemeToSettings(mode: ThemeMode): void {
    if (!this.settings) return;
    const value = this.themeModeToInt(mode);
    if (value === null) return;
    this.settings.set_int(KEY_COLOR_SCHEME, value);
  }

  private themeModeToInt(mode: ThemeMode): number | null {
    switch (mode) {
      case "system":
        return 0;
      case "light":
        return 1;
      case "dark":
        return 2;
      default:
        console.warn(`Unknown theme mode: ${mode}`);
        return null;
    }
  }

  private intToThemeMode(value: number | null | undefined): ThemeMode {
    switch (value ?? DEFAULT_COLOR_SCHEME) {
      case 1:
        return "light";
      case 2:
        return "dark";
      case 0:
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

  private getDisplay(): Gdk.Display | null {
    return Gdk.Display.get_default();
  }
}

export const themeService = new ThemeService();
