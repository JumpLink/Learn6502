import type { LabelsFailureEvent, LabelsInfoEvent } from "./labels-events.js";

/**
 * Map of all labels events and their corresponding payload types
 * This provides type-safety for the EventDispatcher in the Labels class
 */
export interface LabelsEventsMap {
  /**
   * Emitted for informational messages from the Labels class
   */
  "labels-info": LabelsInfoEvent;

  /**
   * Emitted when the Labels class encounters a failure
   */
  "labels-failure": LabelsFailureEvent;
}
