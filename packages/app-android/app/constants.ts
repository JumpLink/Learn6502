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

// ============================================================================
// Default Values
// ============================================================================

/** Default theme mode */
export const DEFAULT_THEME = "system";

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
