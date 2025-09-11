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
