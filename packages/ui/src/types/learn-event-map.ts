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

/**
 * Event map of the Learn view itself, for the shell that hosts it
 */
export interface LearnViewEventMap {
  /**
   * Triggered when the Learn view opens or closes a subpage, so the shell can show a back button
   */
  "subpage-changed": LearnSubpageChangedEvent;

  /**
   * Triggered when the user asks to share their own example
   */
  share: Record<string, never>;
}

export interface LearnSubpageChangedEvent {
  hasSubpage: boolean;
  /** Tag of the page that is now visible */
  tag: string | null;
}
