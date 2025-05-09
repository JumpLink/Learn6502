import { BaseThemeService } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

/**
 * GNOME-specific implementation of the ThemeService
 * Uses Adw.StyleManager for theming
 */
class ThemeService extends BaseThemeService {
  private styleManager: Adw.StyleManager | null = null;
  private settings: Gio.Settings | null = null;

  constructor() {
    super();
  }

  public init(): void {
    // Get the StyleManager singleton
    this.styleManager = Adw.StyleManager.get_default();

    try {
      // Initialize GSettings for theme settings
      this.settings = new Gio.Settings({
        schema_id: "eu.jumplink.Learn6502",
      });

      // Load initial theme mode from settings
      this.loadThemeFromSettings();

      // Monitor settings changes
      this.settings.connect("changed::theme", () => {
        this.loadThemeFromSettings();
      });
    } catch (error) {
      console.error("Error initializing GSettings:", error);
      console.log("Using system theme as fallback");
      // Fallback to system theme and continue without settings
      this.setTheme("system");
    }

    // Monitor system appearance changes
    this.monitorSystemAppearance();
  }

  /**
   * Check if the dark theme is currently active
   */
  protected isCurrentlyDarkTheme(): boolean {
    return this.styleManager?.get_dark() || false;
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
    try {
      if (!this.settings) return;

      const savedTheme = this.settings.get_string("theme");

      if (
        savedTheme &&
        (savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system")
      ) {
        this.setTheme(savedTheme as ThemeMode);
      } else {
        // Use system theme by default
        this.setTheme("system");
      }
    } catch (error) {
      console.error("Error loading theme from settings:", error);
      // Fallback to system theme
      this.setTheme("system");
    }
  }

  /**
   * Save theme to application settings
   */
  private saveThemeToSettings(mode: ThemeMode): void {
    try {
      if (!this.settings) return;

      this.settings.set_string("theme", mode);
    } catch (error) {
      console.error("Error saving theme to settings:", error);
    }
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
        this.notifyListeners();
      }
    });
  }
}

export const themeService = new ThemeService();
