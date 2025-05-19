import { MainUiState } from "../data/index.ts";

/**
 * Event map for debugger events
 */
export interface MainUiStateEventMap {
  "state-changed": MainUiState;
}
