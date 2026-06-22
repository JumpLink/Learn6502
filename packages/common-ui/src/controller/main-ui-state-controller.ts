import type { MainButtonActionState, MainUiStateEventMap, MainUiState } from "../types";
import { MainButtonState } from "../data/index";
import { EventDispatcher, SimulatorState } from "@learn6502/core";
import { buttonStateService } from "../services";
import { ViewType } from "../views/main";

/**
 * Controller class for coordinating main UI state across platforms
 * Acts as a coordinator between the business logic service and UI components
 * Does not implement UI interfaces, only manages state and events
 */
class MainUiStateController {
  readonly events = new EventDispatcher<MainUiStateEventMap>();

  // Current state properties for internal coordination
  private _mainButtonState: MainButtonState = MainButtonState.INITIAL;
  private _simulatorState: SimulatorState = SimulatorState.INITIALIZED;
  private _codeChanged: boolean = false;
  private _viewType: ViewType = ViewType.LEARN;

  /**
   * Private method to handle all state changes and dispatch appropriate events
   */
  private dispatchStateChange(changedProperty?: keyof MainUiState): void {
    const currentState: MainUiState = {
      mainButtonState: this._mainButtonState,
      codeChanged: this._codeChanged,
      viewType: this._viewType,
      simulatorState: this._simulatorState,
    };

    // Dispatch general state-changed event
    this.events.dispatch("state-changed", currentState);

    // Dispatch specific events based on what changed
    if (changedProperty) {
      switch (changedProperty) {
        case "mainButtonState":
          this.events.dispatch("state-changed:main-button-state", this._mainButtonState);
          break;
        case "codeChanged":
          this.events.dispatch("state-changed:code-changed", this._codeChanged);
          break;
        case "viewType":
          this.events.dispatch("state-changed:view-type", this._viewType);
          break;
        case "simulatorState":
          this.events.dispatch("state-changed:simulator-state", this._simulatorState);
          break;
      }
    }
  }

  public init(): void {
    // Initialize service and internal state with default values
    buttonStateService.setViewType(this._viewType);
    buttonStateService.setCodeChanged(this._codeChanged);
    // Initialize with default state
    this.updateFromSimulatorState(SimulatorState.INITIALIZED);
  }

  public setState(state: MainButtonState): void {
    if (this._mainButtonState == state) {
      return;
    }
    this._mainButtonState = state;
    this.dispatchStateChange("mainButtonState");
  }

  public getState(): MainButtonState {
    return this._mainButtonState;
  }

  /**
   * Updates the button state based on the simulator state and current view
   * @param state Current simulator state
   * @returns The updated button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // Store current simulator state for future reference
    const previousSimulatorState = this._simulatorState;
    this._simulatorState = state;

    // Dispatch simulator state change if it actually changed
    if (previousSimulatorState !== state) {
      this.dispatchStateChange("simulatorState");
    }

    // Use service to calculate button state
    const buttonState = buttonStateService.calculateButtonState(state);
    this.setState(buttonState);
    return buttonState;
  }

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  public setCodeChanged(changed: boolean): void {
    // Update both service and internal state
    buttonStateService.setCodeChanged(changed);
    this._codeChanged = changed;

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setState(MainButtonState.ASSEMBLE);
    }

    // Dispatch code-changed specific event
    this.dispatchStateChange("codeChanged");
  }

  public getCodeChanged(): boolean {
    return buttonStateService.getCodeChanged();
  }

  /**
   * Sets the current view type and automatically updates button state
   * @param viewType The new view type
   */
  public setViewType(viewType: ViewType): void {
    const oldViewType = buttonStateService.getViewType();
    if (oldViewType !== viewType) {
      // Update both service and internal state
      buttonStateService.setViewType(viewType);
      this._viewType = viewType;

      // Automatically update button state when view type changes
      this.updateFromSimulatorState(this._simulatorState);

      console.log(`ViewType changed: ${oldViewType} -> ${viewType}`);
      this.dispatchStateChange("viewType");
    }
  }

  /**
   * Gets the current view type
   * @returns The current view type
   */
  public getViewType(): ViewType {
    return this._viewType;
  }

  /**
   * Determine which actions should be enabled based on current state
   * Delegates to the service for platform-independent logic
   *
   * @param state Current simulator state
   * @param hasCode Whether there is code in the editor
   * @param codeChanged Whether the code has changed since last assembly
   * @returns Action enablement state object
   */
  public getActionEnabledState(state: SimulatorState, hasCode: boolean, codeChanged: boolean): MainButtonActionState {
    return buttonStateService.getActionEnabledState(state, hasCode, codeChanged);
  }

  /**
   * Get the current button state from the service
   * @param state Current simulator state
   * @returns The button state to display
   */
  public getButtonState(state: SimulatorState): MainButtonState {
    return buttonStateService.getButtonState(state);
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

  /**
   * Get the navigation target for a specific action based on current view
   * This implements the stepper mode navigation logic
   *
   * @param action The action being performed ('step' | 'run')
   * @returns The target view type, or null if no navigation is needed
   */
  public getNavigationTarget(action: "step" | "run"): ViewType | null {
    return buttonStateService.getNavigationTarget(action);
  }
}

export const mainStateController = new MainUiStateController();
