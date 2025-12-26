import { ContrastChangeEvent } from "./contrast-change-event";
import { SystemAppearanceChangeEvent } from "./system-appearance-change-event";
import { ApplicationEventData, LaunchEventData } from "@nativescript/core";

/**
 * Map of all system events and their corresponding payload types
 * This provides type-safety for the EventDispatcher
 */
export interface SystemEventsMap {
  /**
   * Custom property change events with explicit keys
   */
  "systemAppearance:changed": SystemAppearanceChangeEvent;
  "contrast:changed": ContrastChangeEvent;

  /**
   * NativeScript Application events
   */
  launchEvent: LaunchEventData;
  resumeEvent: ApplicationEventData;
  suspendEvent: ApplicationEventData;
}
