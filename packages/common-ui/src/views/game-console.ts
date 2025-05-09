import { Simulator, Assembler } from "@learn6502/6502";
import type { GamepadKey } from "../types";

/**
 * Signal/event data for game console events
 */
export interface GameConsoleSignal {
  message?: string;
  params?: any[];
  state?: number;
}

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

/**
 * Interface for game console events
 */
export interface GameConsoleEvents {
  /**
   * Event when assembly succeeds
   * @param signal Signal data
   */
  onAssembleSuccess(signal: GameConsoleSignal): void;

  /**
   * Event when assembly fails
   * @param signal Signal data
   */
  onAssembleFailure(signal: GameConsoleSignal): void;

  /**
   * Event when simulator starts
   * @param signal Signal data
   */
  onStart(signal: GameConsoleSignal): void;

  /**
   * Event when simulator stops
   * @param signal Signal data
   */
  onStop(signal: GameConsoleSignal): void;

  /**
   * Event when simulator resets
   * @param signal Signal data
   */
  onReset(signal: GameConsoleSignal): void;

  /**
   * Event when simulator steps
   * @param signal Signal data
   */
  onStep(signal: GameConsoleSignal): void;

  /**
   * Event when hexdump is generated
   * @param signal Signal data
   */
  onHexdump(signal: GameConsoleSignal): void;

  /**
   * Event when disassembly is generated
   * @param signal Signal data
   */
  onDisassembly(signal: GameConsoleSignal): void;

  /**
   * Event when gamepad key is pressed
   * @param key Key that was pressed
   */
  onGamepadPressed(key: number): void;
}
