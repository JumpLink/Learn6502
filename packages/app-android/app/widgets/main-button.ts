import { Property, CSSType, EventData } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { SimulatorState } from "@learn6502/6502"; // Import shared simulator state
import { Fab } from "./fab"; // Import the base Fab class
import {
  MainButtonState,
  type MainButtonMode,
  type MainButtonInterface,
  MainButtonHelper,
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
 * Implements MainButtonInterface from common-ui
 */
@CSSType("MainButton")
export class MainButton extends Fab implements MainButtonInterface {
  // Inherit from Fab
  // Event names for specific actions
  public static assembleTapEvent = "assembleTap";
  public static runTapEvent = "runTap";
  public static pauseTapEvent = "pauseTap";
  public static resumeTapEvent = "resumeTap";
  public static resetTapEvent = "resetTap";
  public static stepTapEvent = "stepTap";
  public static stateChangedEvent = "stateChanged"; // Matches GNOME signal name

  // Property backing fields
  private _state: MainButtonState = stateProperty.defaultValue;
  private _codeChanged: boolean = false;

  // Button modes configuration
  private buttonModes: Record<MainButtonState, MainButtonMode> = {
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
  };

  /**
   * Native property change handler for state
   * @param value - The new button state
   */
  [stateProperty.setNative](value: MainButtonState) {
    this._state = value;
    this.applyMode(value);
    // Note: We emit stateChanged from setMode after applying changes
  }

  constructor() {
    super();
  }

  /**
   * Initializes the native view
   * Overrides the base Fab method to set the custom click listener
   */
  public initNativeView(): void {
    super.initNativeView(); // Call base class initialization first

    // Access the native FAB created by the base class
    const nativeFab = this
      .nativeViewProtected as com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
    if (!nativeFab) {
      return;
    }

    // Use shrink() initially to behave like a standard FAB (icon only)
    nativeFab.shrink(); // Shrink without animation initially

    // Set up the state-dependent click listener, overriding the base Fab's listener
    nativeFab.setOnClickListener(
      new android.view.View.OnClickListener({
        onClick: (view: android.view.View) => {
          let eventName: string | null = null;
          switch (this._state) {
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
        },
      })
    );

    // Apply initial state after the view is fully initialized and listener attached
    this.applyMode(this._state);
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
   * Set the button mode/state
   * @param state The new button state
   */
  public setMode(state: MainButtonState): void {
    // Use nativeViewProtected check instead of this.fab
    if (this._state !== state || !this.nativeViewProtected) {
      this._state = state;
      this.applyMode(state);
    }
  }

  /**
   * Applies the visual properties for the current mode (icon, tooltip)
   * @param state The state to apply
   */
  private applyMode(state: MainButtonState): void {
    // Use nativeViewProtected instead of this.fab
    const nativeFab = this
      .nativeViewProtected as com.google.android.material.floatingactionbutton.ExtendedFloatingActionButton;
    if (!nativeFab) return;

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
    nativeFab.setContentDescription(mode.text);

    // Emit state change event *after* applying changes
    this.notify(<EventData>{
      eventName: MainButton.stateChangedEvent,
      object: this,
      state: state,
    });
  }

  /**
   * Implementation of MainButtonInterface method
   * Sets whether the code has changed since last assembly
   */
  public setCodeChanged(changed: boolean): void {
    this._codeChanged = changed;

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setMode(MainButtonState.ASSEMBLE);
    }
  }

  /**
   * Update button based on simulator state
   * Implements MainButtonInterface
   *
   * @param state Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // If code has changed, always show ASSEMBLE
    if (this._codeChanged) {
      const buttonState = MainButtonState.ASSEMBLE;
      this.setMode(buttonState);
      return buttonState;
    }

    // Use the common helper to determine button state
    const buttonState = MainButtonHelper.getButtonState(state);
    this.setMode(buttonState);
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
    return MainButtonHelper.getActionEnabledState(
      simulatorState,
      hasCode,
      codeChanged
    );
  }
}

// Register custom properties with NativeScript
stateProperty.register(MainButton);
