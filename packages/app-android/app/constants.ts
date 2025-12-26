/**
 * App-wide constants and configuration
 *
 * Pattern from reference projects: centralized constants for settings keys,
 * default values, and enums.
 *
 * Note: Type definitions are in `types/`, utility functions in `utils/`
 */

// ============================================================================
// Application Settings Keys
// ============================================================================

/** Key for storing theme preference (light/dark/system) */
export const SETTINGS_THEME = "eu.jumplink.Learn6502.theme";

/** Key for storing color theme preference */
export const SETTINGS_COLOR_THEME = "eu.jumplink.Learn6502.colorTheme";

/** Key for storing contrast mode preference */
export const SETTINGS_CONTRAST = "eu.jumplink.Learn6502.contrast";

/** Key for storing locale/language preference */
export const SETTINGS_LOCALE = "eu.jumplink.Learn6502.locale";

/** Key for storing font scale preference */
export const SETTINGS_FONT_SCALE = "eu.jumplink.Learn6502.fontScale";

/** Key for storing auto-black theme preference (dark -> black) */
export const SETTINGS_AUTO_BLACK = "eu.jumplink.Learn6502.autoBlack";

// ============================================================================
// Default Values
// ============================================================================

/** Default theme mode */
export const DEFAULT_THEME = "system";

/** Default color theme */
export const DEFAULT_COLOR_THEME = "default";

// ============================================================================
// Enums
// ============================================================================

/**
 * Describes the system contrast mode
 * Values match Android UiModeManager contrast levels
 */
export enum ContrastMode {
  NORMAL = "normal",
  MEDIUM = "medium",
  HIGH = "high",
}
