import { SimulatorState } from "@learn6502/6502";
import { MainButtonState } from "../data/main-button-state";
import type { MainButtonActionState } from "../types";

/**
 * Common interface for MainButton component across platforms
 */
export interface MainButtonWidget {
  /**
   * Updates the button state based on the simulator state
   * @param state Current simulator state
   * @returns The updated button state
   */
  updateFromSimulatorState(state: SimulatorState): MainButtonState;

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  setCodeChanged(changed: boolean): void;
}
