import { Property, CSSType, EventData } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { SimulatorState } from "@learn6502/6502"; // Import shared simulator state
import { Fab } from "./fab"; // Import the base Fab class
import {
  MainButtonState,
  type MainButtonMode,
  type MainButtonWidget,
  mainStateController,
  ViewType,
  type MainUiState,
  buttonStateService,
} from "@learn6502/common-ui";
// Property for the button's state
const stateProperty = new Property<MainButton, MainButtonState>({
  name: "state",
  defaultValue: MainButtonState.ASSEMBLE,
});

/**
 * MainButton widget for Android
 *
 * Mirrors the functionality of the GNOME MainButton, providing context-aware
 * actions (Assemble, Run, Pause, Resume, Reset, Step) based on simulator state.
 * Uses an Android ExtendedFloatingActionButton.
 *
 * Implements MainButtonWidget from common-ui
 */
@CSSType("MainButton")
export class MainButton extends Fab implements MainButtonWidget {
  // Inherit from Fab
  // Event names for specific actions
  public static assembleTapEvent = "assembleTap";
  public static runTapEvent = "runTap";
  public static pauseTapEvent = "pauseTap";
  public static resumeTapEvent = "resumeTap";
  public static resetTapEvent = "resetTap";
  public static stepTapEvent = "stepTap";
  public static stateChangedEvent = "stateChanged"; // Matches GNOME signal name

  // Button modes configuration
  private buttonModes: Record<MainButtonState, MainButtonMode> = {
    [MainButtonState.INITIAL]: {
      iconName: "res://build_alt_symbolic",
      text: _("Assemble"),
      actionName: MainButton.assembleTapEvent,
    },
    [MainButtonState.ASSEMBLE]: {
      iconName: "res://build_alt_symbolic",
      text: _("Assemble"),
      actionName: MainButton.assembleTapEvent,
    },
    [MainButtonState.RUN]: {
      iconName: "res://play_symbolic",
      text: _("Run"),
      actionName: MainButton.runTapEvent,
    },
    [MainButtonState.PAUSE]: {
      iconName: "res://pause_symbolic",
      text: _("Pause"),
      actionName: MainButton.pauseTapEvent,
    },
    [MainButtonState.RESUME]: {
      iconName: "res://play_symbolic",
      text: _("Resume"),
      actionName: MainButton.resumeTapEvent,
    },
    [MainButtonState.RESET]: {
      iconName: "res://reset_symbolic",
      text: _("Reset"),
      actionName: MainButton.resetTapEvent,
    },
    [MainButtonState.STEP]: {
      iconName: "res://step_over_symbolic",
      text: _("Step"),
      actionName: MainButton.stepTapEvent,
    },
    [MainButtonState.HIDDEN]: {
      iconName: "res://build_alt_symbolic", // Fallback icon, won't be shown
      text: _("Hidden"),
      actionName: MainButton.assembleTapEvent, // Fallback action, won't be used
    },
  };

  /**
   * Native property change handler for state
   * @param value - The new button state
   */
  [stateProperty.setNative](value: MainButtonState) {
    this.setState(value);
  }

  constructor() {
    super();
    this.onStateChanged = this.onStateChanged.bind(this);
    this.onButtonTap = this.onButtonTap.bind(this);
  }

  public init(): void {
    this.addEventListeners();
    mainStateController.init();

    if (!this.nativeFab) {
      return;
    }

    // Use shrink() initially to behave like a standard FAB (icon only)
    this.nativeFab.shrink(); // Shrink without animation initially

    // Set up the state-dependent click listener, overriding the base Fab's listener
    this.nativeFab.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: this.onButtonTap,
      })
    );
  }

  /**
   * Initializes the native view
   * Overrides the base Fab method to set the custom click listener
   */
  public initNativeView(): void {
    super.initNativeView(); // Call base class initialization first
    this.init();
  }

  /**
   * Disposes the native view and cleans up resources
   * Only need to call super, base Fab handles listener removal
   */
  public disposeNativeView(): void {
    // No need to remove system state listener here, base Fab does it.
    // No need to nullify fab, base class handles nativeViewProtected.
    super.disposeNativeView();
  }

  /**
   * Set the button state and update UI
   * Implements MainButtonWidget
   * @param state The new button state
   */
  public setState(state: MainButtonState): void {
    mainStateController.setState(state);
  }

  /**
   * Get the current button state
   * Implements MainButtonWidget
   */
  public getState(): MainButtonState {
    return mainStateController.getState();
  }

  /**
   * Implementation of MainButtonWidget method
   * Sets whether the code has changed since last assembly
   */
  public setCodeChanged(changed: boolean): void {
    // Update controller state
    mainStateController.setCodeChanged(changed);

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setState(MainButtonState.ASSEMBLE);
    }
  }

  /**
   * Get whether code has changed
   * Implements MainButtonWidget
   */
  public getCodeChanged(): boolean {
    return mainStateController.getCodeChanged();
  }

  /**
   * Update button based on simulator state and current view
   * Implements MainButtonWidget
   *
   * @param state Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // Use the mainStateController to determine button state
    const buttonState = mainStateController.updateFromSimulatorState(state);
    this.setState(buttonState);
    return buttonState;
  }

  /**
   * Convenience method to get enabled state for actions
   * Uses the common helper for consistency across platforms
   */
  public static getActionEnabledState(
    simulatorState: SimulatorState,
    hasCode: boolean,
    codeChanged: boolean
  ) {
    return mainStateController.getActionEnabledState(
      simulatorState,
      hasCode,
      codeChanged
    );
  }

  /**
   * Instance method to get enabled state for actions
   * Uses the common helper for consistency across platforms
   */
  public getActionEnabledState(
    simulatorState: SimulatorState,
    hasCode: boolean,
    codeChanged: boolean
  ) {
    return mainStateController.getActionEnabledState(
      simulatorState,
      hasCode,
      codeChanged
    );
  }

  /**
   * Set action enabled states
   * @param enabledState Object containing enabled states for each action
   */
  public setActionEnabledStates(enabledState: {
    assemble: boolean;
    run: boolean;
    resume: boolean;
    pause: boolean;
    reset: boolean;
    step: boolean;
  }): void {
    // In Android, we don't disable the FAB itself, but we could
    // store this state if needed for visual feedback
    // For now, just log it for debugging
    console.log("[MainButton] Action enabled states:", enabledState);
  }

  protected addEventListeners(): void {
    mainStateController.events.on("state-changed", this.onStateChanged);
  }

  protected onStateChanged(state: MainUiState): void {
    if (!this.nativeFab) return;

    const newState = state.mainButtonState;

    // Handle HIDDEN state - completely hide the button
    if (newState === MainButtonState.HIDDEN) {
      // Hide with animation and ensure it stays hidden
      this.hide();
      // Set visibility to GONE to ensure it's completely hidden
      this.nativeFab.setVisibility(android.view.View.GONE);
      return;
    }

    // If transitioning to visible state, ensure button is visible
    this.nativeFab.setVisibility(android.view.View.VISIBLE);
    this.show();

    // Update button appearance for the new state
    const mode = this.buttonModes[newState];
    if (!mode) {
      console.error(`MainButton: Invalid state - ${newState}`);
      return;
    }

    // Set Icon using the inherited property setter from Fab
    this.icon = mode.iconName;
    this.text = mode.text;

    // Set Tooltip (Content Description for accessibility)
    this.nativeFab.setContentDescription(mode.text);

    // Emit state change event *after* applying changes
    this.notify(<EventData>{
      eventName: MainButton.stateChangedEvent,
      object: this,
      state: newState,
    });
  }

  // TODO: Move this to a common event handler?
  protected onButtonTap(): void {
    console.log("[MainButton] onButtonTap");
    let eventName: string | null = null;
    switch (this.getState()) {
      case MainButtonState.ASSEMBLE:
        eventName = MainButton.assembleTapEvent;
        break;
      case MainButtonState.RUN:
        eventName = MainButton.runTapEvent;
        break;
      case MainButtonState.PAUSE:
        eventName = MainButton.pauseTapEvent;
        break;
      case MainButtonState.RESUME:
        eventName = MainButton.resumeTapEvent;
        break;
      case MainButtonState.RESET:
        eventName = MainButton.resetTapEvent;
        break;
      case MainButtonState.STEP:
        eventName = MainButton.stepTapEvent;
        break;
    }
    if (eventName) {
      this.notify({ eventName: eventName, object: this });
    }
  }
}

// Register custom properties with NativeScript
stateProperty.register(MainButton);
