import type { MainButtonState } from "../data/index.ts";
import type { ViewType } from "../views/main";
import type { SimulatorState } from "@learn6502/core";

/**
 * Complete state object containing all UI states
 */
export interface MainUiState {
  mainButtonState: MainButtonState;
  codeChanged: boolean;
  viewType: ViewType;
  simulatorState: SimulatorState;
}

/**
 * Event map for main UI state events
 */
export interface MainUiStateEventMap {
  // All-in-one state change event
  "state-changed": MainUiState;

  // Specific state change events
  "state-changed:main-button-state": MainButtonState;
  "state-changed:code-changed": boolean;
  "state-changed:view-type": ViewType;
  "state-changed:simulator-state": SimulatorState;

  // Action events (unchanged)
  assemble: void;
  run: void;
  pause: void;
  resume: void;
  reset: void;
  step: void;

  // Navigation events (unchanged)
  "navigate-to-view": { viewType: string };
}
