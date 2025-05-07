import type { SimulatorState } from "@learn6502/6502";

/**
 * Common interface for MainView component across platforms
 * This represents the main application window/page
 */
export interface MainView {
  /**
   * Current state of the simulator
   */
  readonly state: SimulatorState;

  /**
   * Assembles the code in the editor
   */
  assembleGameConsole(): void;

  /**
   * Runs the assembled code
   */
  runGameConsole(): void;

  /**
   * Pauses the running code
   */
  pauseGameConsole(): void;

  /**
   * Resets the simulator
   */
  reset(): void;

  /**
   * Executes a single step of the program
   */
  stepGameConsole(): void;

  /**
   * Sets the code in the editor
   * @param code The code to set
   */
  setEditorCode(code: string): void;
}
