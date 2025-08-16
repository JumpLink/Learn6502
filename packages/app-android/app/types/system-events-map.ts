import { ContrastChangeEvent } from "./contrast-change-event";
import { SystemAppearanceChangeEvent } from "./system-appearance-change-event";
import { WindowInsetsChangeEvent } from "./window-insets-change-event";
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
  "windowInsets:changed": WindowInsetsChangeEvent;

  /**
   * NativeScript Application events
   */
  launchEvent: LaunchEventData;
  resumeEvent: ApplicationEventData;
  suspendEvent: ApplicationEventData;
}
