import { Memory, Simulator, Assembler, Labels } from "@learn6502/6502";
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
   * The memory instance
   */
  readonly memory: Memory;

  /**
   * The labels instance
   */
  readonly labels: Labels;

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
   * Generate a hexdump of the current memory state
   */
  hexdump(): void;

  /**
   * Disassemble the current code in memory
   */
  disassemble(): void;

  /**
   * Stop/pause the simulator
   */
  stop(): void;

  /**
   * Reset the simulator and memory
   */
  reset(): void;

  /**
   * Execute a single step in the simulator
   */
  step(): void;

  /**
   * Go to a specific memory address
   * @param address The address to go to in string format
   */
  goto(address: string): void;

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
