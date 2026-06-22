import { SimulatorState } from "@learn6502/core";
import { MainButtonState } from "../data/index";
import { ViewType } from "../views/main";
import type { MainButtonActionState } from "../types";

/**
 * Service containing platform-independent business logic for button state management
 * Handles all state calculations and transitions without UI dependencies
 */
export class ButtonStateService {
  // State tracking
  private _codeChanged: boolean = false;
  private _viewType: ViewType = ViewType.LEARN;

  /**
   * Updates the button to indicate code has changed and needs to be assembled
   * @param changed Whether code has changed
   */
  public setCodeChanged(changed: boolean): void {
    this._codeChanged = changed;
  }

  public getCodeChanged(): boolean {
    return this._codeChanged;
  }

  /**
   * Sets the current view type
   * @param viewType The new view type
   */
  public setViewType(viewType: ViewType): void {
    this._viewType = viewType;
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
   *
   * @param state Current simulator state
   * @param hasCode Whether there is code in the editor
   * @param codeChanged Whether the code has changed since last assembly
   * @returns Action enablement state object
   */
  public getActionEnabledState(state: SimulatorState, hasCode: boolean, codeChanged: boolean): MainButtonActionState {
    // Default: disable all actions
    const enabledState: MainButtonActionState = {
      assemble: false,
      run: false,
      resume: false,
      pause: false,
      reset: false,
      step: false,
      share: false,
    };

    // Always enable assemble if there's code
    enabledState.assemble = hasCode;

    // Enable share when code is present and in certain states
    // Share is available in PAUSED, COMPLETED, DEBUGGING_PAUSED states
    enabledState.share =
      hasCode &&
      (state === SimulatorState.PAUSED ||
        state === SimulatorState.COMPLETED ||
        state === SimulatorState.DEBUGGING_PAUSED);

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
        // No stepping past the end of a completed program (see issue #109),
        // the user has to reset or run again
        enabledState.run = true;
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
    switch (this._viewType) {
      case ViewType.LEARN:
        return MainButtonState.HIDDEN;
      case ViewType.STORYBOOK:
        return MainButtonState.HIDDEN;
      case ViewType.EDITOR:
        return MainButtonState.ASSEMBLE;
    }

    // If code has changed, always show ASSEMBLE
    if (this._codeChanged) {
      return MainButtonState.ASSEMBLE;
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
   * Calculate the next button state based on simulator state
   * This is the main business logic that determines what the button should show
   *
   * @param state Current simulator state
   * @returns The updated button state
   */
  public calculateButtonState(state: SimulatorState): MainButtonState {
    // Use the main button state calculation logic
    return this.getButtonState(state);
  }

  /**
   * Determines the target view for navigation based on current view and action
   * This implements the stepper mode navigation logic:
   * - When stepping: stay in current view (Debugger stays in Debugger, Game Console stays in Game Console)
   * - When running: from Debugger navigate to Game Console, from Game Console stay in Game Console
   *
   * @param action The action being performed ('step' | 'run')
   * @returns The target view type, or null if no navigation is needed
   */
  public getNavigationTarget(action: "step" | "run"): ViewType | null {
    switch (action) {
      case "step":
        // For stepping: always stay in current view
        return this._viewType;

      case "run":
        // For running: if in Debugger, navigate to Game Console; otherwise stay
        if (this._viewType === ViewType.DEBUGGER) {
          return ViewType.GAME_CONSOLE;
        }
        return this._viewType;

      default:
        return null;
    }
  }
}

// Export singleton instance
export const buttonStateService = new ButtonStateService();
