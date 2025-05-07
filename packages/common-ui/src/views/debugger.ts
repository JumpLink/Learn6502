import { Simulator, Assembler } from "@learn6502/6502";

/**
 * Interface for debugger views across platforms
 */
export interface DebuggerView {
  /**
   * Update the debugger with current simulator state
   * @param memory Memory array to display
   * @param simulator Simulator instance for state information
   */
  update(memory: Uint8Array, simulator: Simulator): void;

  /**
   * Reset the debugger view
   */
  reset(): void;

  /**
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  updateHexdump(assembler: Assembler): void;

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  updateDisassembled(assembler: Assembler): void;

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  log(message: string): void;

  /**
   * Clean up resources when closing
   */
  close(): void;

  /**
   * Execute multiple steps at once
   * @param count Number of steps to execute
   */
  multiStep(count: number): void;

  /**
   * Jump to a specific address
   * @param address Address to jump to
   */
  goToAddress(address: number): void;
}

/**
 * Interface for debugger events
 */
export interface DebuggerEvents {
  /**
   * Event when copying content to clipboard
   * @param code The code being copied
   */
  onCopyToClipboard(code: string): void;

  /**
   * Event when copying content to editor
   * @param code The code being copied to editor
   */
  onCopyToEditor(code: string): void;
}
