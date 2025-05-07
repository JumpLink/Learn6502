import type { Memory, Simulator } from "@learn6502/6502";
import type { DebuggerState } from "../data/index.js";

export interface DebuggerWidget {
  state: DebuggerState;
  update(memory: Memory, simulator: Simulator): void;
  updateMonitor(memory: Memory): void;
  updateDebugInfo(simulator: Simulator): void;
  reset(): void;
}
