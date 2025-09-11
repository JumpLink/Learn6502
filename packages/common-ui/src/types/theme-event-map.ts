import type { ThemeMode } from "./theme-mode";

/**
 * Event map for theme service events
 */
export interface ThemeEventMap {
  /**
   * Emitted when the theme is changed.
   */
  "theme-changed": ThemeChangedEvent;

  /**
   * Emitted when the system support for color schemes changes.
   */
  "system-support-changed": SystemSupportChangedEvent;
}

export interface ThemeChangedEvent {
  /**
   * The new theme mode.
   */
  theme: ThemeMode;

  /**
   * Whether dark theme is currently active.
   */
  isDark: boolean;
}

export interface SystemSupportChangedEvent {
  /**
   * Whether the system supports color schemes.
   */
  supported: boolean;
}
