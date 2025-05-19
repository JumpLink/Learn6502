import type { MainButtonActionState, MainUiStateEventMap } from "../types";
import { MainUiState } from "../data/index";
import { EventDispatcher, SimulatorState } from "@learn6502/6502";
import type { MainButtonWidget } from "../widgets";

/**
 * Controller class for main state implementations across platforms
 * Contains shared logic that can be reused
 */
class MainUiStateController implements MainButtonWidget {
  // State tracking
  protected _codeChanged: boolean = false;

  readonly events = new EventDispatcher<MainUiStateEventMap>();

  // Current state property
  private _state: MainUiState = MainUiState.INITIAL;

  public setState(state: MainUiState): void {
    if (this._state == state) {
      return;
    }
    this._state = state;
    this.events.dispatch("state-changed", state);
  }

  public getState(): MainUiState {
    return this._state;
  }

  public init(): void {
    // Initialize with default state
    this.setState(MainUiState.ASSEMBLE);
  }

  /**
   * Updates the button state based on the simulator state
   * @param state Current simulator state
   * @returns The updated button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainUiState {
    // If code has changed, always show ASSEMBLE
    if (this._codeChanged) {
      return MainUiState.ASSEMBLE;
    }

    const buttonState = this.getButtonState(state);
    this.setState(buttonState);
    return buttonState;
  }

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  public setCodeChanged(changed: boolean): void {
    this._codeChanged = changed;

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setState(MainUiState.ASSEMBLE);
    }
  }

  public getCodeChanged(): boolean {
    return this._codeChanged;
  }

  /**
   * Determine which actions should be enabled based on current state
   *
   * @param state Current simulator state
   * @param hasCode Whether there is code in the editor
   * @param codeChanged Whether the code has changed since last assembly
   * @returns Action enablement state object
   */
  public getActionEnabledState(
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
  public getButtonState(state: SimulatorState): MainUiState {
    let buttonState: MainUiState;
    switch (state) {
      case SimulatorState.INITIALIZED:
        buttonState = MainUiState.ASSEMBLE;
        break;

      case SimulatorState.RUNNING:
        buttonState = MainUiState.PAUSE;
        break;

      case SimulatorState.DEBUGGING:
        buttonState = MainUiState.STEP;
        break;

      case SimulatorState.COMPLETED:
        buttonState = MainUiState.RESET;
        break;

      case SimulatorState.PAUSED:
        buttonState = MainUiState.RESUME;
        break;

      case SimulatorState.DEBUGGING_PAUSED:
        buttonState = MainUiState.STEP;
        break;

      case SimulatorState.READY:
        buttonState = MainUiState.RUN;
        break;

      default:
        throw new Error(`Unknown simulator state: ${state}`);
    }

    return buttonState;
  }
}

export const mainStateController = new MainUiStateController();
