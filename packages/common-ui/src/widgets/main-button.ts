import type { SimulatorState } from "@learn6502/6502";
import type { MainButtonState } from "../data/index";
import { ViewType } from "../views/main";

/**
 * Common interface for MainButton component across platforms
 */
export interface MainButtonWidget {
  /**
   * Updates the button state based on the simulator state and current view
   * @param state Current simulator state
   * @returns The updated button state
   */
  updateFromSimulatorState(state: SimulatorState): MainButtonState;

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  setCodeChanged(changed: boolean): void;

  /**
   * Get the code changed state
   * @returns Whether code has changed
   */
  getCodeChanged(): boolean;

  /**
   * Gets the current button state
   * @returns Current UI state
   */
  getState(): MainButtonState;

  /**
   * Sets the button state and updates UI accordingly
   * @param state The new button state
   */
  setState(state: MainButtonState): void;
}
