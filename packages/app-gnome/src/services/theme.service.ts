import { ThemeService as BaseThemeService } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import Gio from "@girs/gio-2.0";
import mainCss from "../main.css?inline";

/**
 * GNOME-specific implementation of the ThemeService
 * Uses Adw.StyleManager for theming
 */
class ThemeService extends BaseThemeService {
  private styleManager: Adw.StyleManager | null = null;
  private settings: Gio.Settings | null = null;
  private cssProvider: Gtk.CssProvider | null = null;
  private primaryProvider: Gtk.CssProvider | null = null;
  /**
   * Widgets that should automatically receive theme-related CSS classes.
   */
  private themedWidgets: Set<Gtk.Widget> = new Set();
  /**
   * Named primary color key when using predefined color families.
   * null => auto/custom without a named key, "none" => explicit no-primary mode
   */
  private currentPrimaryKey: string | null = null;

  constructor() {
    super();
  }

  public init(): void {
    // Load application CSS once
    if (!this.cssProvider) {
      this.cssProvider = new Gtk.CssProvider();
      this.cssProvider.load_from_string(mainCss);
      const display = Gdk.Display.get_default();
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
    this.settings = new Gio.Settings({ schema_id: "eu.jumplink.Learn6502" });

    // Load initial theme mode from settings
    this.loadThemeFromSettings();

    // Monitor settings changes
    this.settings.connect("changed::color-scheme", () =>
      this.loadThemeFromSettings()
    );

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

    // Sync classes on theme/primary changes
    this.events.on("theme-changed", () => this.refreshThemedWidgets());
    this.events.on("primary-changed", () => this.refreshThemedWidgets());
  }

  /** Remove current primary CSS provider from the display, if any. */
  private clearPrimaryCssProvider(): void {
    const display = Gdk.Display.get_default();
    if (!display) return;
    if (this.primaryProvider) {
      Gtk.StyleContext.remove_provider_for_display(
        display,
        this.primaryProvider
      );
      this.primaryProvider = null;
    }
  }

  /** Install a new primary CSS provider from a CSS string. Replaces the existing one. */
  private updatePrimaryCssProviderFromCss(css: string): void {
    const display = Gdk.Display.get_default();
    if (!display) return;
    this.clearPrimaryCssProvider();
    const provider = new Gtk.CssProvider();
    provider.load_from_string(css);
    Gtk.StyleContext.add_provider_for_display(
      display,
      provider,
      Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION
    );
    this.primaryProvider = provider;
  }

  /**
   * Check if the dark theme is currently active
   */
  protected isCurrentlyDarkTheme(): boolean {
    return this.styleManager?.get_dark() || false;
  }

  public get isDarkTheme(): boolean {
    return this.isCurrentlyDarkTheme();
  }

  /**
   * Apply the selected theme to the Adw.StyleManager
   */
  protected applyTheme(mode: ThemeMode): void {
    // Apply theme according to mode
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

    // Save theme to settings
    this.saveThemeToSettings(mode);
  }

  /**
   * Set a custom primary color via CSS variable. Pass null to clear and follow system.
   * @param hexOrNull CSS color string (e.g. "#3584e4") or null to clear
   */
  public setPrimaryColor(hexOrNull: string | null): void {
    if (!hexOrNull) {
      // Clearing primary: rely on libadwaita defaults
      this.currentPrimaryKey = null;
      this.events.dispatch("primary-changed", {
        color: null,
        key: null,
        mode: "auto",
      });
      return;
    }

    // Install a small provider that defines our CSS variable
    this.updatePrimaryCssProviderFromCss(
      `:root { --learn-primary-color: ${hexOrNull}; }`
    );
    this.currentPrimaryKey = null;
    this.events.dispatch("primary-changed", {
      color: hexOrNull,
      key: null,
      mode: "custom",
    });
  }

  /** Clear any explicit primary, follow system defaults. */
  public clearPrimaryColor(): void {
    this.setPrimaryColor(null);
  }

  /**
   * Set primary by a predefined key using Adwaita CSS variables.
   * @param key One of the supported color families.
   */
  public setPrimaryByKey(
    key:
      | "blue"
      | "teal"
      | "green"
      | "yellow"
      | "orange"
      | "red"
      | "pink"
      | "purple"
      | "slate"
  ): void {
    this.updatePrimaryCssProviderFromCss(
      `:root { --learn-primary-color: var(--accent-${key}); }`
    );
    this.currentPrimaryKey = key;
    this.events.dispatch("primary-changed", {
      color: null,
      key,
      mode: "custom",
    });
  }

  /** Follow system primary (auto). */
  public setPrimaryAuto(): void {
    this.clearPrimaryColor();
    this.currentPrimaryKey = null;
    this.events.dispatch("primary-changed", {
      color: null,
      key: null,
      mode: "auto",
    });
  }

  /** No primary override: keep system defaults but mark class as none. */
  public setPrimaryNone(): void {
    this.clearPrimaryColor();
    this.currentPrimaryKey = "none" as any;
    this.events.dispatch("primary-changed", {
      color: null,
      key: null,
      mode: "none",
    });
  }

  /**
   * Register a widget to receive theme-related CSS classes.
   * @param widget Target widget
   */
  public registerThemedWidget(widget: Gtk.Widget): void {
    this.themedWidgets.add(widget);
    this.applyClasses(widget);
  }

  /**
   * Unregister a widget from receiving theme-related CSS classes.
   * @param widget Target widget
   */
  public unregisterThemedWidget(widget: Gtk.Widget): void {
    if (this.themedWidgets.delete(widget)) {
      this.clearClasses(widget);
    }
  }

  /** Force re-applying classes to all registered widgets. */
  public refreshThemedWidgets(): void {
    for (const w of this.themedWidgets) this.applyClasses(w);
  }

  /** Apply CSS classes for mode and primary color onto a widget. */
  private applyClasses(widget: Gtk.Widget): void {
    this.clearClasses(widget);
    widget.add_css_class("themed");
    const mode = this.currentTheme;
    const isDark = this.isDarkTheme;
    widget.add_css_class(`mode-${mode}`);
    widget.add_css_class(isDark ? "is-dark" : "is-light");
    if (this.currentPrimaryKey) {
      if (this.currentPrimaryKey === "none") {
        widget.add_css_class("primary-none");
      } else {
        widget.add_css_class(`primary-${this.currentPrimaryKey}`);
      }
    }
  }

  /** Remove all theme-related classes from a widget. */
  private clearClasses(widget: Gtk.Widget): void {
    widget.remove_css_class("themed");
    widget.remove_css_class("mode-system");
    widget.remove_css_class("mode-light");
    widget.remove_css_class("mode-dark");
    widget.remove_css_class("is-dark");
    widget.remove_css_class("is-light");
    // primary-* classes
    widget.remove_css_class("primary-none");
    widget.remove_css_class("primary-blue");
    widget.remove_css_class("primary-teal");
    widget.remove_css_class("primary-green");
    widget.remove_css_class("primary-yellow");
    widget.remove_css_class("primary-orange");
    widget.remove_css_class("primary-red");
    widget.remove_css_class("primary-pink");
    widget.remove_css_class("primary-purple");
    widget.remove_css_class("primary-slate");
  }

  /**
   * Load theme from application settings
   */
  private loadThemeFromSettings(): void {
    if (!this.settings) return;
    const savedColorScheme = this.settings.get_int("color-scheme");
    this.setColorScheme(savedColorScheme);
  }

  /**
   * Save theme to application settings
   */
  private saveThemeToSettings(mode: ThemeMode): void {
    if (!this.settings) return;

    // Convert ThemeMode to color-scheme integer format (0=follow,1=light,2=dark)
    let colorSchemeValue: number;
    switch (mode) {
      case "system":
        colorSchemeValue = 0; // follow
        break;
      case "light":
        colorSchemeValue = 1;
        break;
      case "dark":
        colorSchemeValue = 2;
        break;
      default:
        console.warn(`Unknown theme mode: ${mode}`);
        return;
    }

    this.settings.set_int("color-scheme", colorSchemeValue);
  }

  /**
   * Monitor changes to the system theme and update accordingly
   */
  private monitorSystemAppearance(): void {
    // React to changes in StyleManager
    this.styleManager?.connect("notify::dark", () => {
      // Only update if we're in system mode
      if (this._currentTheme === "system") {
        this._isDarkTheme = this.styleManager?.get_dark() || false;
        this.notifyThemeChanged();
      }
    });
  }

  public setColorSchemeFollowSystem(): void {
    this.setTheme("system");
  }

  public setColorSchemeLight(): void {
    this.setTheme("light");
  }

  public setColorSchemeDark(): void {
    this.setTheme("dark");
  }

  /**
   * Set color scheme by string or integer parameter (like Workbench)
   */
  public setColorScheme(scheme: string | number): void {
    let schemeValue: string;

    if (typeof scheme === "number") {
      // Convert integer to string (like Workbench: 0=follow, 1=light, 2=dark)
      switch (scheme) {
        case 0:
          schemeValue = "follow";
          break;
        case 1:
          schemeValue = "light";
          break;
        case 2:
          schemeValue = "dark";
          break;
        default:
          console.warn(`Unknown color scheme number: ${scheme}`);
          return;
      }
    } else {
      schemeValue = scheme;
    }

    switch (schemeValue) {
      case "follow":
      case "system":
        this.setColorSchemeFollowSystem();
        break;
      case "light":
        this.setColorSchemeLight();
        break;
      case "dark":
        this.setColorSchemeDark();
        break;
      default:
        console.warn(`Unknown color scheme: ${schemeValue}`);
        break;
    }
  }

  public isSystemColorSchemeSupported(): boolean {
    return this.styleManager?.get_system_supports_color_schemes() ?? false;
  }
}

export const themeService = new ThemeService();
