/**
 * Interface for learn view across platforms
 */
export interface LearnView {
  /**
   * Save the current scroll position
   */
  saveScrollPosition(): void;

  /**
   * Restore the previously saved scroll position
   */
  restoreScrollPosition(): void;
}
