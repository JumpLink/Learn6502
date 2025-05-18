import type { MainButtonActionState } from "../types";
import { MainButtonState } from "../data/main-button-state";
import { SimulatorState } from "@learn6502/6502";
import type { MainButtonWidget } from "../widgets";

/**
 * Controller class for MainButton implementations across platforms
 * Contains shared logic that can be reused
 */
class MainButtonController implements MainButtonWidget {
  // State tracking
  private _codeChanged: boolean = false;

  /**
   * Updates the button state based on the simulator state
   * @param state Current simulator state
   * @returns The updated button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // If code has changed, always show ASSEMBLE
    if (this._codeChanged) {
      return MainButtonState.ASSEMBLE;
    }

    return this.getButtonState(state);
  }

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  public setCodeChanged(changed: boolean): void {
    this._codeChanged = changed;
  }

  /**
   * Determine which actions should be enabled based on current state
   *
   * @param state Current simulator state
   * @param hasCode Whether there is code in the editor
   * @param codeChanged Whether the code has changed since last assembly
   * @returns Action enablement state object
   */
  getActionEnabledState(
    state: SimulatorState,
    hasCode: boolean,
    codeChanged: boolean
  ): MainButtonActionState {
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

  /**
   * Determine the appropriate button state based on simulator state
   *
   * @param state Current simulator state
   * @returns The button state to display
   */
  getButtonState(state: SimulatorState): MainButtonState {
    switch (state) {
      case SimulatorState.INITIALIZED:
      case SimulatorState.READY:
        return MainButtonState.ASSEMBLE;
      case SimulatorState.RUNNING:
        return MainButtonState.PAUSE;
      case SimulatorState.PAUSED:
        return MainButtonState.RESUME;
      case SimulatorState.COMPLETED:
        return MainButtonState.RESET;
      case SimulatorState.DEBUGGING:
      case SimulatorState.DEBUGGING_PAUSED:
        return MainButtonState.STEP;
      default:
        return MainButtonState.ASSEMBLE;
    }
  }
}

export const mainButtonController = new MainButtonController();
