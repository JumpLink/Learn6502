import type { ThemeChangeListener, ThemeMode } from "../types";

/**
 * Abstract class for theme services
 */
export abstract class ThemeService {
  protected _currentTheme: ThemeMode = "system";
  protected _isDarkTheme: boolean = false;
  protected listeners: Map<string, ThemeChangeListener> = new Map();

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
    this.notifyListeners();
  }

  /**
   * Add theme change listener
   * @param listener Callback function for theme changes
   * @returns ID of the listener for removal
   */
  public addThemeChangeListener(listener: ThemeChangeListener): string {
    const id = this.generateListenerId();
    this.listeners.set(id, listener);

    // Call listener immediately with current state
    listener(this._currentTheme, this._isDarkTheme);

    return id;
  }

  /**
   * Remove theme change listener
   * @param id ID of the listener to remove
   */
  public removeThemeChangeListener(id: string): boolean {
    return this.listeners.delete(id);
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
  protected notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this._currentTheme, this._isDarkTheme);
    });
  }

  /**
   * Generates a unique ID for listeners
   */
  private generateListenerId(): string {
    return `theme-listener-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
