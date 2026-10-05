import type { Memory, Simulator, Assembler } from "@learn6502/core";
import type { DebuggerState } from "../data/index.ts";

/**
 * Event map for debugger events
 */
export interface DebuggerEventMap {
  copyToClipboard: string;
  copyToEditor: string;
  stateChanged: DebuggerState;
  reset: void;
  stepperToggled: boolean;
}
