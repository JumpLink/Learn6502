import { SimulatorState } from "@learn6502/6502";
import { MainButtonState } from "../data/main-button-state";

/**
 * Represents the enabled state for different button actions
 */
export interface MainButtonActionState {
  assemble: boolean;
  run: boolean;
  resume: boolean;
  pause: boolean;
  reset: boolean;
  step: boolean;
}

/**
 * Common interface for MainButton component across platforms
 */
export interface MainButtonInterface {
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

/**
 * Utility function to determine which actions should be enabled based on current state
 *
 * @param state Current simulator state
 * @param hasCode Whether there is code in the editor
 * @param codeChanged Whether the code has changed since last assembly
 * @returns The action enabled state
 */
export function getMainButtonActionEnabledState(
  state: SimulatorState,
  hasCode: boolean,
  codeChanged: boolean
): MainButtonActionState {
  // Default implementation that can be overridden by platform-specific implementations
  return {
    assemble:
      hasCode &&
      (codeChanged ||
        state === SimulatorState.INITIALIZED ||
        state === SimulatorState.READY),
    run:
      hasCode &&
      (state === SimulatorState.READY || state === SimulatorState.PAUSED),
    resume: hasCode && state === SimulatorState.PAUSED,
    pause: hasCode && state === SimulatorState.RUNNING,
    reset:
      hasCode &&
      (state === SimulatorState.READY ||
        state === SimulatorState.RUNNING ||
        state === SimulatorState.PAUSED),
    step:
      hasCode &&
      (state === SimulatorState.READY ||
        state === SimulatorState.PAUSED ||
        state === SimulatorState.DEBUGGING ||
        state === SimulatorState.DEBUGGING_PAUSED),
  };
}
