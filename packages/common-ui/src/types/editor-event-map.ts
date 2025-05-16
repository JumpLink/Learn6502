export interface EditorEventMap {
  /**
   * Emitted when the editor content is updated.
   */
  changed: EditorChangedEvent;
}

export interface EditorChangedEvent {
  /**
   * The editor content.
   */
  code: string;
}
