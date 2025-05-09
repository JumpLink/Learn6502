import { SimulatorState } from "@learn6502/6502";
import { MainButtonState } from "../data/main-button-state";

/**
 * Common UIService interface for managing UI state across platforms
 * Provides a platform-agnostic way to manage state transitions
 */
export interface UIService {
  /**
   * Current state of the simulator
   */
  readonly state: SimulatorState;

  /**
   * Update UI elements based on simulator state
   * @param state Current simulator state
   */
  updateUIFromSimulatorState(state: SimulatorState): void;

  /**
   * Show a toast/notification message
   * @param message Message to display
   * @param timeout Duration in seconds (optional)
   */
  showToast(message: string, timeout?: number): void;

  /**
   * Handle unsaved changes check
   * @param action Action to perform after handling unsaved changes
   * @returns Promise that resolves when handling is complete
   */
  handleUnsavedChanges(action: string): Promise<boolean>;
}

/**
 * Base class with common UI service functionality
 * Platforms can extend this class for shared behavior
 */
export abstract class BaseUIService implements UIService {
  // Current state tracking
  protected _simulatorState: SimulatorState = SimulatorState.INITIALIZED;
  protected _unsavedChanges: boolean = false;
  protected _codeChanged: boolean = false;

  /**
   * Get current simulator state
   */
  get state(): SimulatorState {
    return this._simulatorState;
  }

  /**
   * Set unsaved changes flag
   */
  protected set unsavedChanges(value: boolean) {
    this._unsavedChanges = value;
    this.onUnsavedChangesChanged(value);
  }

  /**
   * Get unsaved changes flag
   */
  protected get unsavedChanges(): boolean {
    return this._unsavedChanges;
  }

  /**
   * Callback when unsaved changes state changes
   * @param hasUnsavedChanges Current unsaved changes state
   */
  protected abstract onUnsavedChangesChanged(hasUnsavedChanges: boolean): void;

  /**
   * Update UI based on simulator state
   * @param state New simulator state
   */
  public updateUIFromSimulatorState(state: SimulatorState): void {
    this._simulatorState = state;
    this.onSimulatorStateChanged(state);
  }

  /**
   * Show a notification/toast message
   * @param message Message to display
   * @param timeout Duration in seconds (optional)
   */
  public abstract showToast(message: string, timeout?: number): void;

  /**
   * Handle unsaved changes modal and actions
   * @param action Action to perform after handling unsaved changes
   * @returns Promise that resolves to whether to continue with action
   */
  public abstract handleUnsavedChanges(action: string): Promise<boolean>;

  /**
   * Method called when simulator state changes
   * @param state New simulator state
   */
  protected abstract onSimulatorStateChanged(state: SimulatorState): void;

  /**
   * Helper method to get button state from simulator state
   * @param state Current simulator state
   * @returns Appropriate button state
   */
  protected getButtonStateFromSimulatorState(
    state: SimulatorState
  ): MainButtonState {
    if (this._codeChanged) {
      return MainButtonState.ASSEMBLE;
    }

    switch (state) {
      case SimulatorState.INITIALIZED:
      case SimulatorState.READY:
        return MainButtonState.RUN;
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
