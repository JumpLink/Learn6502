import { BaseThemeManager } from "@learn6502/common-ui";
import type { ThemeMode } from "@learn6502/common-ui";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

/**
 * GNOME-specific implementation of the ThemeManager
 * Uses Adw.StyleManager for theming
 */
export class GnomeThemeManager extends BaseThemeManager {
  private styleManager: Adw.StyleManager;
  private settings: Gio.Settings;

  constructor() {
    super();

    // Get the StyleManager singleton
    this.styleManager = Adw.StyleManager.get_default();

    // Initialize GSettings for theme settings
    this.settings = new Gio.Settings({
      schema_id: "eu.jumplink.Learn6502",
    });

    // Load initial theme mode from settings
    this.loadThemeFromSettings();

    // Monitor system appearance changes
    this.monitorSystemAppearance();
  }

  /**
   * Check if the dark theme is currently active
   */
  protected isCurrentlyDarkTheme(): boolean {
    return this.styleManager.get_dark();
  }

  /**
   * Apply the selected theme to the Adw.StyleManager
   */
  protected applyTheme(mode: ThemeMode): void {
    // Apply theme according to mode
    switch (mode) {
      case "light":
        this.styleManager.set_color_scheme(Adw.ColorScheme.FORCE_LIGHT);
        break;
      case "dark":
        this.styleManager.set_color_scheme(Adw.ColorScheme.FORCE_DARK);
        break;
      case "system":
      default:
        this.styleManager.set_color_scheme(Adw.ColorScheme.DEFAULT);
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
      const savedTheme = this.settings.get_string("color-scheme");

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
      this.settings.set_string("color-scheme", mode);
    } catch (error) {
      console.error("Error saving theme to settings:", error);
    }
  }

  /**
   * Monitor changes to the system theme and update accordingly
   */
  private monitorSystemAppearance(): void {
    // React to changes in StyleManager
    this.styleManager.connect("notify::dark", () => {
      // Only update if we're in system mode
      if (this._currentTheme === "system") {
        this._isDarkTheme = this.styleManager.get_dark();
        this.notifyListeners();
      }
    });

    // React to changes in settings
    this.settings.connect("changed::color-scheme", () => {
      this.loadThemeFromSettings();
    });
  }
}
