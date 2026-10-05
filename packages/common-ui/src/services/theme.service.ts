import type { ThemeMode } from "../types";
import type { ThemeEventMap } from "../types/theme-event-map";
import { EventDispatcher } from "@learn6502/core";

/**
 * Abstract class for theme services
 */
export abstract class ThemeService {
  protected _currentTheme: ThemeMode = "system";
  protected _isDarkTheme: boolean = false;
  public readonly events = new EventDispatcher<ThemeEventMap>();

  /**
   * Current theme setting
   */
  public get currentTheme(): ThemeMode {
    return this._currentTheme;
  }

  /**
   * Indicates whether dark theme is currently active
   */
  public get isDarkTheme(): boolean {
    return this._isDarkTheme;
  }

  /**
   * Set theme to a specific mode
   * @param mode The theme mode to use
   */
  public setTheme(mode: ThemeMode): void {
    if (this._currentTheme === mode) return;

    this._currentTheme = mode;
    this.applyTheme(mode);

    // Update isDarkTheme based on the actual mode
    this._isDarkTheme = this.isCurrentlyDarkTheme();

    // Notify listeners
    this.notifyThemeChanged();
  }

  /**
   * Checks if dark theme is currently active in the current mode
   * @returns true if dark theme is active
   */
  protected abstract isCurrentlyDarkTheme(): boolean;

  /**
   * Applies the theme to the application (platform-specific)
   * @param mode The mode to apply
   */
  protected abstract applyTheme(mode: ThemeMode): void;

  /**
   * Notifies all registered listeners about theme changes
   */
  protected notifyThemeChanged(): void {
    this.events.dispatch("theme-changed", {
      theme: this._currentTheme,
      isDark: this._isDarkTheme,
    });
  }
}
