/**
 * Interface for editor views across platforms
 */
export interface EditorView {
  /**
   * Get the current code in the editor
   */
  readonly code: string;

  /**
   * Set code in the editor
   * @param value Code to set
   */
  setCode(value: string): void;

  /**
   * Check if editor has code
   */
  readonly hasCode: boolean;

  /**
   * Add content to the editor at current position
   * @param content Content to add
   */
  addContent(content: string): void;

  /**
   * Clear editor content
   */
  clear(): void;

  /**
   * Set focus to the editor
   * @returns Whether focus was successfully set
   */
  focus(): boolean;

  /**
   * Handle editor change event
   * @param handler Handler function
   */
  onChanged(handler: () => void): void;
}

/**
 * Interface for editor events
 */
export interface EditorEvents {
  /**
   * Event when code in editor changes
   */
  onCodeChanged(): void;

  /**
   * Event when code is assembled via keyboard shortcut
   */
  onAssembleRequested(): void;

  /**
   * Event when run is requested via keyboard shortcut
   */
  onRunRequested(): void;
}
