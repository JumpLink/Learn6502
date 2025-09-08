import { EventDispatcher } from "@learn6502/6502";
import type { LearnEventMap } from "../types/learn-event-map";
import { learnStateService } from "../services/index.ts";

/**
 * Learn controller to communicate between platform-specific learn views
 * Acts as a coordinator between learn state service and UI components
 */
class LearnController {
  readonly events = new EventDispatcher<LearnEventMap>();

  /**
   * Save the current scroll position
   * @param position Current scroll position to save
   */
  public saveScrollPosition(position?: number): void {
    if (position !== undefined) {
      learnStateService.saveScrollPosition(position);
    }
  }

  /**
   * Restore the previously saved scroll position
   * @returns The last saved scroll position
   */
  public restoreScrollPosition(): number {
    return learnStateService.getLastScrollPosition();
  }

  /**
   * Get the current scroll position
   * @returns The current scroll position
   */
  public getCurrentScrollPosition(): number {
    return learnStateService.lastScrollPosition;
  }

  /**
   * Set the current section being viewed
   * @param sectionId Section identifier
   */
  public setCurrentSection(sectionId: string): void {
    learnStateService.currentSection = sectionId;
  }

  /**
   * Get the current section being viewed
   * @returns Current section identifier
   */
  public getCurrentSection(): string {
    return learnStateService.currentSection;
  }

  /**
   * Mark a section as completed
   * @param sectionId Section identifier
   */
  public markSectionCompleted(sectionId: string): void {
    learnStateService.markSectionCompleted(sectionId);
  }

  /**
   * Check if a section is completed
   * @param sectionId Section identifier
   * @returns True if section is completed
   */
  public isSectionCompleted(sectionId: string): boolean {
    return learnStateService.isSectionCompleted(sectionId);
  }

  /**
   * Get learning progress as percentage
   * @param totalSections Total number of sections
   * @returns Progress percentage (0-100)
   */
  public getProgressPercentage(totalSections: number): number {
    return learnStateService.getProgressPercentage(totalSections);
  }

  /**
   * Clear all learning progress
   */
  public clearProgress(): void {
    learnStateService.clearProgress();
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
