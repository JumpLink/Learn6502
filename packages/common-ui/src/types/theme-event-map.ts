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
   * Emitted when the primary color changes (custom, auto, or none).
   */
  "primary-changed": PrimaryChangedEvent;

  /**
   * Emitted when the accent color changes (system or custom).
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

export interface PrimaryChangedEvent {
  /** CSS color for the primary if explicitly set; null for auto/none. */
  color: string | null;

  /** Named key if a predefined family is selected; null/undefined otherwise. */
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

  /** Selection mode: auto (system), custom (by key or color), none. */
  mode?: "auto" | "custom" | "none";
}

export interface AccentChangedEvent {
  /** Named key if a predefined family is selected; null when following system. */
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

  /** Selection mode: system (follow system accent) or custom (by key). */
  mode: "system" | "custom";
}
