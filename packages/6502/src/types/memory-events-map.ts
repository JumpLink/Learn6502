import type { MemoryChangedEvent } from "./memory-events.js";

/**
 * Map of all memory events and their corresponding payload types
 * This provides type-safety for the EventDispatcher in the Memory class
 */
export interface MemoryEventsMap {
  /**
   * Emitted when a memory location is changed
   */
  changed: MemoryChangedEvent;
}
