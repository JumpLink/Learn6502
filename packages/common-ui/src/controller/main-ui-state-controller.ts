import type { MainButtonActionState, MainUiStateEventMap } from "../types";
import { MainButtonState } from "../data/index";
import { EventDispatcher, SimulatorState } from "@learn6502/6502";
import type { MainButtonWidget } from "../widgets";
import { ViewType } from "../views/main";

/**
 * Controller class for main state implementations across platforms
 * Contains shared logic that can be reused
 */
class MainUiStateController implements MainButtonWidget {
  // State tracking
  protected _codeChanged: boolean = false;
  protected _currentViewType: ViewType = ViewType.LEARN;
  protected _currentSimulatorState: SimulatorState = SimulatorState.INITIALIZED;

  readonly events = new EventDispatcher<MainUiStateEventMap>();

  // Current state property
  private _state: MainButtonState = MainButtonState.INITIAL;

  public setState(state: MainButtonState): void {
    if (this._state == state) {
      return;
    }
    this._state = state;
    this.events.dispatch("state-changed", state);
  }

  public getState(): MainButtonState {
    return this._state;
  }

  public init(): void {
    // Initialize with default state based on current view type
    this.updateFromSimulatorState(this._currentSimulatorState);
  }

  /**
   * Updates the button state based on the simulator state and current view
   * @param state Current simulator state
   * @returns The updated button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // Store current simulator state for future reference
    this._currentSimulatorState = state;

    // If code has changed, always show ASSEMBLE
    if (this._codeChanged) {
      const buttonState = MainButtonState.ASSEMBLE;
      this.setState(buttonState);
      return buttonState;
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
      this.setState(MainButtonState.ASSEMBLE);
    }

    // Emit code-changed event
    this.events.dispatch("code-changed", changed);
  }

  public getCodeChanged(): boolean {
    return this._codeChanged;
  }

  /**
   * Sets the current view type and automatically updates button state
   * @param viewType The new view type
   */
  public setViewType(viewType: ViewType): void {
    if (this._currentViewType !== viewType) {
      const oldViewType = this._currentViewType;
      this._currentViewType = viewType;

      // Automatically update button state when view type changes
      this.updateFromSimulatorState(this._currentSimulatorState);

      console.log(`ViewType changed: ${oldViewType} -> ${viewType}`);
      this.events.dispatch("view-changed", viewType);
    }
  }

  /**
   * Gets the current view type
   * @returns The current view type
   */
  public getViewType(): ViewType {
    return this._currentViewType;
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
   * Determine the appropriate button state based on simulator state and current view
   *
   * @param state Current simulator state
   * @returns The button state to display
   */
  public getButtonState(state: SimulatorState): MainButtonState {
    let buttonState: MainButtonState;

    // Check if button should be hidden based on current view
    if (this._currentViewType === ViewType.LEARN) {
      return MainButtonState.HIDDEN;
    }

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

  /**
   * Emit assemble event
   */
  public emitAssemble(): void {
    this.events.dispatch("assemble", undefined);
  }

  /**
   * Emit run event
   */
  public emitRun(): void {
    this.events.dispatch("run", undefined);
  }

  /**
   * Emit pause event
   */
  public emitPause(): void {
    this.events.dispatch("pause", undefined);
  }

  /**
   * Emit resume event
   */
  public emitResume(): void {
    this.events.dispatch("resume", undefined);
  }

  /**
   * Emit reset event
   */
  public emitReset(): void {
    this.events.dispatch("reset", undefined);
  }

  /**
   * Emit step event
   */
  public emitStep(): void {
    this.events.dispatch("step", undefined);
  }

  /**
   * Emit navigate-to-view event
   */
  public emitNavigateToView(viewType: string): void {
    this.events.dispatch("navigate-to-view", { viewType });
  }
}

export const mainStateController = new MainUiStateController();
