/**
 * Event map for learn view events
 */
export interface LearnEventMap {
  /**
   * Triggered when code should be copied to the editor
   */
  copy: LearnCopyEvent;
}

export interface LearnCopyEvent {
  /**
   * The code snippet to copy.
   */
  code: string;
}
