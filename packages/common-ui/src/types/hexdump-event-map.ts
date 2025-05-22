export interface HexdumpEventMap {
  /**
   * Emitted when the user copies the hex dump content.
   */
  copy: HexdumpCopyEvent;
}

export interface HexdumpCopyEvent {
  /**
   * The hex dump content.
   */
  content: string;
}
