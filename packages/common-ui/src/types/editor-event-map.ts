export interface EditorEventMap {
  /**
   * Emitted when the editor content is updated.
   */
  changed: EditorChangedEvent;

  /**
   * Emitted when the help panel visibility changes.
   */
  helpVisibilityChanged: EditorHelpVisibilityChangedEvent;
}

export interface EditorChangedEvent {
  /**
   * The editor content.
   */
  code: string;
}

export interface EditorHelpVisibilityChangedEvent {
  /**
   * Whether the help panel is visible.
   */
  visible: boolean;
}
