/**
 * Type definitions for the variables module
 */

/**
 * Window insets structure representing safe area padding
 */
export interface WindowInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Events emitted by the variables module
 */
export interface VariablesEventsMap {
  "windowInsets:changed": { newValue: WindowInsets; oldValue: WindowInsets };
  "actionBarHeight:changed": { newValue: number; oldValue: number };
  "fontScale:changed": { newValue: number; oldValue: number };
  "rtl:changed": { newValue: boolean; oldValue: boolean };
}
