import type { Memory, Simulator } from "@learn6502/6502";
import type { DebuggerState } from "../data/index.js";

export interface DebuggerWidget {
  state: DebuggerState;

  /**
   * Update the debugger with current simulator state
   * @param memory Memory array to display
   * @param simulator Simulator instance for state information
   */
  update(memory: Memory, simulator: Simulator): void;

  /**
   * Update the memory monitor display
   * @param memory Memory to update
   */
  updateMonitor(memory: Memory): void;

  /**
   * Update debug information like registers and flags
   * @param simulator Current state of the simulator
   */
  updateDebugInfo(simulator: Simulator): void;

  /**
   * Reset the debugger view
   */
  reset(): void;

  /**
   * Clean up resources when closing
   */
  close(): void;
}
