import type { SimulatorState } from "@learn6502/6502";

/**
 * View types supported across platforms
 */
export enum ViewType {
  LEARN = "learn",
  EDITOR = "editor",
  DEBUGGER = "debugger",
  GAME_CONSOLE = "gameConsole",
  /** Only for development purposes */
  STORYBOOK = "storybook",
}

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
   * Current active view/tab
   */
  readonly activeView?: ViewType;

  /**
   * Navigates to a specific view/tab
   * Each platform implementation will handle how to perform the navigation
   * @param viewType The view to navigate to
   */
  navigateToView(viewType: ViewType): void;

  /**
   * Assembles the code in the editor
   * Will navigate to the debugger view
   */
  assembleGameConsole(): void;

  /**
   * Runs the assembled code
   * Navigation behavior depends on current view:
   * - From Debugger: navigates to Game Console view
   * - From Game Console: stays in Game Console view
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
   * Navigation behavior depends on current view (stepper mode):
   * - From Debugger: stays in Debugger view
   * - From Game Console: stays in Game Console view
   */
  stepGameConsole(): void;

  /**
   * Sets the code in the editor
   * Will navigate to the editor view
   * @param code The code to set
   */
  setEditorCode(code: string): void;
}
