import { Property, CSSType, EventData } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { SimulatorState } from "@learn6502/6502"; // Import shared simulator state
import { Fab } from "./fab"; // Import the base Fab class
import {
  MainUiState,
  type MainButtonMode,
  type MainButtonWidget,
  mainStateController,
} from "@learn6502/common-ui";
// Property for the button's state
const stateProperty = new Property<MainButton, MainUiState>({
  name: "state",
  defaultValue: MainUiState.ASSEMBLE,
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
  private buttonModes: Record<MainUiState, MainButtonMode> = {
    [MainUiState.INITIAL]: {
      iconName: "res://build_alt_symbolic",
      text: _("Assemble"),
      actionName: MainButton.assembleTapEvent,
    },
    [MainUiState.ASSEMBLE]: {
      iconName: "res://build_alt_symbolic",
      text: _("Assemble"),
      actionName: MainButton.assembleTapEvent,
    },
    [MainUiState.RUN]: {
      iconName: "res://play_symbolic",
      text: _("Run"),
      actionName: MainButton.runTapEvent,
    },
    [MainUiState.PAUSE]: {
      iconName: "res://pause_symbolic",
      text: _("Pause"),
      actionName: MainButton.pauseTapEvent,
    },
    [MainUiState.RESUME]: {
      iconName: "res://play_symbolic",
      text: _("Resume"),
      actionName: MainButton.resumeTapEvent,
    },
    [MainUiState.RESET]: {
      iconName: "res://reset_symbolic",
      text: _("Reset"),
      actionName: MainButton.resetTapEvent,
    },
    [MainUiState.STEP]: {
      iconName: "res://step_over_symbolic",
      text: _("Step"),
      actionName: MainButton.stepTapEvent,
    },
  };

  /**
   * Native property change handler for state
   * @param value - The new button state
   */
  [stateProperty.setNative](value: MainUiState) {
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
  public setState(state: MainUiState): void {
    mainStateController.setState(state);
  }

  /**
   * Get the current button state
   * Implements MainButtonWidget
   */
  public getState(): MainUiState {
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
      this.setState(MainUiState.ASSEMBLE);
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
   * Update button based on simulator state
   * Implements MainButtonWidget
   *
   * @param state Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainUiState {
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

  protected addEventListeners(): void {
    mainStateController.events.on("state-changed", this.onStateChanged);
  }

  protected onStateChanged(state: MainUiState): void {
    if (!this.nativeFab) return;

    const mode = this.buttonModes[state];
    if (!mode) {
      console.error(`MainButton: Invalid state - ${state}`);
      return;
    }

    // Set Icon using the inherited property setter from Fab
    this.icon = mode.iconName; // Base class will handle applying this to nativeFab.setIconResource
    this.text = mode.text;

    // Set Tooltip (Content Description for accessibility)
    // Directly access nativeFab for content description as Fab doesn't expose it
    // TODO: Consider adding a setTooltip/setContentDescription method to the base Fab class
    this.nativeFab.setContentDescription(mode.text);

    // Emit state change event *after* applying changes
    this.notify(<EventData>{
      eventName: MainButton.stateChangedEvent,
      object: this,
      state: state,
    });
  }

  // TODO: Move this to a common event handler?
  protected onButtonTap(): void {
    console.log("[MainButton] onButtonTap");
    let eventName: string | null = null;
    switch (this.getState()) {
      case MainUiState.ASSEMBLE:
        eventName = MainButton.assembleTapEvent;
        break;
      case MainUiState.RUN:
        eventName = MainButton.runTapEvent;
        break;
      case MainUiState.PAUSE:
        eventName = MainButton.pauseTapEvent;
        break;
      case MainUiState.RESUME:
        eventName = MainButton.resumeTapEvent;
        break;
      case MainUiState.RESET:
        eventName = MainButton.resetTapEvent;
        break;
      case MainUiState.STEP:
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
