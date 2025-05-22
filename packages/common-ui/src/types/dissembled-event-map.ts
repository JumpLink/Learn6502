export interface DisassembledEventMap {
  /**
   * Emitted when the user copies the disassembled code.
   */
  copy: DisassembledCopyEvent;
}

export interface DisassembledCopyEvent {
  /**
   * The disassembled code.
   */
  code: string;
}
