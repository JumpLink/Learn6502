import { Simulator, Assembler } from "@learn6502/6502";
import type { GamepadKey } from "../types";

/**
 * Interface for game console views across platforms
 */
export interface GameConsoleView {
  /**
   * The simulator instance
   */
  readonly simulator: Simulator;

  /**
   * The assembler instance
   */
  readonly assembler: Assembler;

  /**
   * The memory array
   */
  readonly memory: Uint8Array;

  /**
   * Assemble code using the assembler
   * @param code Code to assemble
   */
  assemble(code: string): void;

  /**
   * Run the simulator
   */
  run(): void;

  /**
   * Stop/pause the simulator
   */
  stop(): void;

  /**
   * Reset the simulator and memory
   */
  reset(): void;

  /**
   * Handle gamepad key press
   * @param key Key that was pressed
   */
  gamepadPress(key: GamepadKey): void;

  /**
   * Clean up resources when closing
   */
  close(): void;
}
