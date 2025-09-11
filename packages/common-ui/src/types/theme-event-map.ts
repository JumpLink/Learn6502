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

  /**
   * Emitted when the accent changes (custom, auto, or none).
   */
  "accent-changed": AccentChangedEvent;
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

export interface AccentChangedEvent {
  /**
   * CSS color for the accent if explicitly set; null for auto/none.
   * Example: "#3584e4" or a computed color string.
   */
  color: string | null;

  /**
   * Named accent key if a predefined family is selected; null/undefined otherwise.
   */
  key?:
    | "blue"
    | "teal"
    | "green"
    | "yellow"
    | "orange"
    | "red"
    | "pink"
    | "purple"
    | "slate"
    | null;

  /**
   * Accent selection mode.
   * - auto: follow system accent
   * - custom: explicit user selection (by key or color)
   * - none: no accent override
   */
  mode?: "auto" | "custom" | "none";
}
