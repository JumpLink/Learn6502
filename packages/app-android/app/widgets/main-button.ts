import { Property, CSSType, EventData } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { SimulatorState } from "@learn6502/6502"; // Import shared simulator state
import { Fab } from "./fab"; // Import the base Fab class

// Define the button states, mirroring the GNOME version
export enum MainButtonState {
  ASSEMBLE = "assemble",
  RUN = "run",
  PAUSE = "pause",
  RESUME = "resume",
  RESET = "reset",
  STEP = "step",
}

// Define the structure for button modes
export interface MainButtonMode {
  iconName: string; // Android resource name (e.g., "res://ic_assemble")
  text: string;
}

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
 */
@CSSType("MainButton")
export class MainButton extends Fab {
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

  // Button modes configuration (Using placeholder Android resource names)
  // TODO: Replace placeholder icons (res://ic_...) with actual drawable resource names
  private buttonModes: Record<MainButtonState, MainButtonMode> = {
    [MainButtonState.ASSEMBLE]: {
      iconName: "res://build_alt_symbolic", // Example: use 'ic_build' or similar
      text: _("Assemble"),
    },
    [MainButtonState.RUN]: {
      iconName: "res://play_symbolic", // Example: use 'ic_play_arrow'
      text: _("Run"),
    },
    [MainButtonState.PAUSE]: {
      iconName: "res://pause_symbolic", // Example: use 'ic_pause'
      text: _("Pause"),
    },
    [MainButtonState.RESUME]: {
      iconName: "res://play_symbolic", // Example: use 'ic_play_arrow'
      text: _("Resume"),
    },
    [MainButtonState.RESET]: {
      iconName: "res://reset_symbolic", // Example: use 'ic_replay'
      text: _("Reset"),
    },
    [MainButtonState.STEP]: {
      iconName: "res://step_over_symbolic", // Example: use 'ic_skip_next'
      text: _("Step"),
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

  // --- Logic mirrored from GNOME MainButton ---

  /**
   * Update button based on simulator state
   * @param simState Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(simState: SimulatorState): MainButtonState {
    let newButtonState: MainButtonState;

    switch (simState) {
      case SimulatorState.INITIALIZED:
        newButtonState = MainButtonState.ASSEMBLE;
        break;
      case SimulatorState.RUNNING:
        newButtonState = MainButtonState.PAUSE;
        break;
      case SimulatorState.DEBUGGING: // Assuming DEBUGGING implies stepping is possible
      case SimulatorState.DEBUGGING_PAUSED:
        newButtonState = MainButtonState.STEP; // Default to Step in debug modes
        break;
      case SimulatorState.COMPLETED:
        newButtonState = MainButtonState.RESET;
        break;
      case SimulatorState.PAUSED:
        newButtonState = MainButtonState.RESUME;
        break;
      case SimulatorState.READY:
        newButtonState = MainButtonState.RUN;
        break;
      default:
        console.warn(
          `Unknown simulator state: ${simState}, defaulting to ASSEMBLE`
        );
        newButtonState = MainButtonState.ASSEMBLE; // Fallback
    }

    this.setMode(newButtonState);
    return newButtonState;
  }

  /**
   * Convenience method to get enabled state for actions (logic only)
   * Note: This doesn't directly enable/disable the FAB itself, but mirrors the logic
   *       from the GNOME component for use in the containing view/controller.
   */
  public static getActionEnabledState(
    simulatorState: SimulatorState,
    hasCode: boolean, // Does the editor have code? Passed from outside
    codeChanged: boolean
  ): {
    assemble: boolean;
    run: boolean;
    resume: boolean;
    pause: boolean;
    reset: boolean;
    step: boolean;
  } {
    const enabledState = {
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
      // Only assemble is possible if code changed
      return enabledState;
    }

    // Logic based on simulator state (when code hasn't changed)
    switch (simulatorState) {
      case SimulatorState.RUNNING:
        enabledState.pause = true;
        enabledState.reset = true;
        break;

      case SimulatorState.DEBUGGING:
        enabledState.step = true;
        enabledState.pause = true; // Can pause debugging run
        enabledState.reset = true;
        enabledState.run = true; // Can switch to normal run
        break;

      case SimulatorState.COMPLETED:
        // Allow re-run, step (from start), or reset
        enabledState.run = true;
        enabledState.step = true;
        enabledState.reset = true;
        break;

      case SimulatorState.PAUSED:
        enabledState.resume = true;
        enabledState.run = true; // Allow restart from beginning
        enabledState.reset = true;
        enabledState.step = true; // Allow stepping from paused state
        break;

      case SimulatorState.DEBUGGING_PAUSED:
        enabledState.step = true;
        enabledState.resume = true; // Resume debugging run
        enabledState.run = true; // Allow switching to normal run
        enabledState.reset = true;
        break;

      case SimulatorState.READY: // Assembled, ready to run or step
        enabledState.run = true;
        enabledState.step = true;
        enabledState.reset = true;
        break;

      case SimulatorState.INITIALIZED: // Not assembled yet
        // assemble is handled by hasCode check
        break;

      default:
        // Keep all disabled for unknown states
        break;
    }

    return enabledState;
  }
}

// Register custom properties with NativeScript
stateProperty.register(MainButton);
