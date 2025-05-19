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
    // Default: disable all actions
    const enabledState: MainButtonActionState = {
      assemble: false,
      run: false,
      resume: false,
      pause: false,
      reset: false,
      step: false,
    };

    // Always enable assemble if there's code
    enabledState.assemble = hasCode;

    if (codeChanged) {
      return enabledState;
    }

    switch (state) {
      case SimulatorState.RUNNING:
        enabledState.pause = true;
        enabledState.reset = true;
        break;

      case SimulatorState.DEBUGGING:
        enabledState.step = true;
        enabledState.pause = true;
        enabledState.reset = true;
        enabledState.run = true;
        break;

      case SimulatorState.COMPLETED:
        enabledState.run = true;
        enabledState.step = true;
        enabledState.reset = true;
        break;

      case SimulatorState.PAUSED:
        enabledState.resume = true;
        enabledState.run = true;
        enabledState.reset = true;
        enabledState.step = true;
        break;

      case SimulatorState.DEBUGGING_PAUSED:
        enabledState.step = true;
        enabledState.resume = true;
        enabledState.run = true;
        enabledState.reset = true;
        break;

      case SimulatorState.READY:
        enabledState.run = true;
        enabledState.step = true;
        enabledState.reset = true;
        break;
    }

    return enabledState;
  }

  /**
   * Determine the appropriate button state based on simulator state
   *
   * @param state Current simulator state
   * @returns The button state to display
   */
  getButtonState(state: SimulatorState): MainButtonState {
    let buttonState: MainButtonState;
    switch (state) {
      case SimulatorState.INITIALIZED:
        buttonState = MainButtonState.ASSEMBLE;
        break;

      case SimulatorState.RUNNING:
        buttonState = MainButtonState.PAUSE;
        break;

      case SimulatorState.DEBUGGING:
        buttonState = MainButtonState.STEP;
        break;

      case SimulatorState.COMPLETED:
        buttonState = MainButtonState.RESET;
        break;

      case SimulatorState.PAUSED:
        buttonState = MainButtonState.RESUME;
        break;

      case SimulatorState.DEBUGGING_PAUSED:
        buttonState = MainButtonState.STEP;
        break;

      case SimulatorState.READY:
        buttonState = MainButtonState.RUN;
        break;

      default:
        throw new Error(`Unknown simulator state: ${state}`);
    }

    return buttonState;
  }
}

export const mainButtonController = new MainButtonController();
