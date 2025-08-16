import type { Memory, Simulator, Assembler } from "@learn6502/6502";
import { DebuggerState } from "../data/index.ts";

/**
 * Event map for debugger events
 */
export interface DebuggerEventMap {
  copyToClipboard: string;
  copyToEditor: string;
  stateChanged: DebuggerState;
  reset: void;
}
