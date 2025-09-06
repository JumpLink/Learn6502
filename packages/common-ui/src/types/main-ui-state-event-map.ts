import { MainButtonState } from "../data/index.ts";
import { ViewType } from "../views/main";

/**
 * Event map for main UI state events
 */
export interface MainUiStateEventMap {
  "state-changed": MainButtonState;
  assemble: void;
  run: void;
  pause: void;
  resume: void;
  reset: void;
  step: void;
  "code-changed": boolean;
  "navigate-to-view": { viewType: string };
  "view-changed": ViewType;
}
