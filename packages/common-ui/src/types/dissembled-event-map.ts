export interface DisassembledEventMap {
  /**
   * Emitted when the user copies the disassembled code.
   */
  copy: {
    /**
     * The disassembled code.
     */
    code: string;
  };
}
