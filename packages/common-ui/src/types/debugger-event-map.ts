import type { Memory, Simulator, Assembler } from "@learn6502/6502";

/**
 * Event map for debugger events
 */
export interface DebuggerEventMap {
  copyToClipboard: string;
  copyToEditor: string;
}
