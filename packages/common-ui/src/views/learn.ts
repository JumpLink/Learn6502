import { EventDispatcher } from "@learn6502/6502";
import type { LearnEventMap } from "../types/learn-event-map.js";
/**
 * Interface for learn view across platforms
 */
export interface LearnView {
  readonly events: EventDispatcher<LearnEventMap>;

  /**
   * Save the current scroll position
   */
  saveScrollPosition(): void;

  /**
   * Restore the previously saved scroll position
   */
  restoreScrollPosition(): void;
}
