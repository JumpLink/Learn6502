/**
 * Type definitions for the variables module
 */

/**
 * Events emitted by the variables module
 */
export interface VariablesEventsMap {
  "actionBarHeight:changed": { newValue: number; oldValue: number };
  "fontScale:changed": { newValue: number; oldValue: number };
  "rtl:changed": { newValue: boolean; oldValue: boolean };
}
