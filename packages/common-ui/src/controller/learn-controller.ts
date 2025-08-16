import { EventDispatcher } from "@learn6502/6502";
import type { LearnEventMap } from "../types/learn-event-map";
import type { LearnView } from "../views";

/**
 * Learn controller to communicate between platform-specific learn views
 * Acts as a bridge between the learn view and other components
 */
class LearnController implements LearnView {
  readonly events = new EventDispatcher<LearnEventMap>();

  // Store the last scroll position (platform implementations may use this)
  private _lastScrollPosition: number = 0;

  /**
   * Save the current scroll position
   * Platform-specific implementations will provide more concrete behaviors
   */
  public saveScrollPosition(): void {
    // Base implementation - will be extended by platform-specific implementations
    // This can be called by platform implementations to update the shared state
  }

  /**
   * Restore the previously saved scroll position
   * Platform-specific implementations will provide more concrete behaviors
   */
  public restoreScrollPosition(): void {
    // Base implementation - will be extended by platform-specific implementations
    // This can be called by platform implementations to get the shared state
  }

  /**
   * Add an event listener
   * @param event Event name
   * @param callback Callback to call when event is triggered
   */
  public on<K extends keyof LearnEventMap>(
    event: K,
    callback: (data: LearnEventMap[K]) => void
  ): void {
    this.events.on(event, callback);
  }

  /**
   * Remove an event listener
   * @param event Event name
   * @param callback Callback to remove
   */
  public off<K extends keyof LearnEventMap>(
    event: K,
    callback: (data: LearnEventMap[K]) => void
  ): void {
    this.events.off(event, callback);
  }

  /**
   * Dispatch an event
   * @param event Event name
   * @param data Event data
   */
  public dispatch<K extends keyof LearnEventMap>(
    event: K,
    data: LearnEventMap[K]
  ): void {
    this.events.dispatch(event, data);
  }
}

// Create singleton instance
export const learnController = new LearnController();
