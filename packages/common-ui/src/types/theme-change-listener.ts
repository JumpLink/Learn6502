import type { ThemeMode } from "./theme-mode";

/**
 * Interface for event handlers on theme changes
 */
export interface ThemeChangeListener {
  (mode: ThemeMode, isDark: boolean): void;
}
