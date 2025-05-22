import { SimulatorState } from "@learn6502/6502";
import { MainUiState } from "../data/index";

/**
 * Common interface for MainButton component across platforms
 */
export interface MainButtonWidget {
  /**
   * Updates the button state based on the simulator state
   * @param state Current simulator state
   * @returns The updated button state
   */
  updateFromSimulatorState(state: SimulatorState): MainUiState;

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
  getState(): MainUiState;

  /**
   * Sets the button state and updates UI accordingly
   * @param state The new button state
   */
  setState(state: MainUiState): void;
}
