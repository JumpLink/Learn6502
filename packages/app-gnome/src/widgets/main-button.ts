import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { SimulatorState } from "@learn6502/6502";
import {
  MainButtonState,
  type MainButtonMode,
  type MainButtonWidget,
  mainStateController,
  ViewType,
} from "@learn6502/common-ui";

import Template from "./main-button.blp";

/**
 * MainButton widget
 *
 * A button widget that changes its appearance and functionality based on
 * the current state of the simulator.
 *
 * Implements MainButtonWidget from common-ui
 */
export class MainButton extends Adw.Bin implements MainButtonWidget {
  // Internal child widgets
  declare private _button: Gtk.Button;
  declare private _revealer: Gtk.Revealer;

  // Signals
  static {
    GObject.registerClass(
      {
        GTypeName: "MainButton",
        Template,
        InternalChildren: ["button", "revealer"],
        Properties: {
          state: GObject.ParamSpec.string(
            "state",
            "State",
            "Current button state",
            GObject.ParamFlags.READWRITE,
            MainButtonState.ASSEMBLE
          ),
        },
      },
      this
    );
  }

  // Button action names
  private assembleAction = "assemble";
  private runSimulatorAction = "run-simulator";
  private resumeSimulatorAction = "resume-simulator";
  private pauseSimulatorAction = "pause-simulator";
  private resetSimulatorAction = "reset-simulator";
  private stepSimulatorAction = "step-simulator";

  // Button modes configuration
  private buttonModes: Record<MainButtonState, MainButtonMode> = {
    [MainButtonState.INITIAL]: {
      iconName: "build-alt-symbolic",
      text: _("Assemble"),
      actionName: this.assembleAction,
    },
    [MainButtonState.ASSEMBLE]: {
      iconName: "build-alt-symbolic",
      text: _("Assemble"),
      actionName: this.assembleAction,
    },
    [MainButtonState.RUN]: {
      iconName: "play-symbolic",
      text: _("Run"),
      actionName: this.runSimulatorAction,
    },
    [MainButtonState.PAUSE]: {
      iconName: "pause-symbolic",
      text: _("Pause"),
      actionName: this.pauseSimulatorAction,
    },
    [MainButtonState.RESUME]: {
      iconName: "play-symbolic",
      text: _("Resume"),
      actionName: this.resumeSimulatorAction,
    },
    [MainButtonState.RESET]: {
      iconName: "reset-symbolic",
      text: _("Reset"),
      actionName: this.resetSimulatorAction,
    },
    [MainButtonState.STEP]: {
      iconName: "step-over-symbolic",
      text: _("Step"),
      actionName: this.stepSimulatorAction,
    },
    [MainButtonState.HIDDEN]: {
      iconName: "build-alt-symbolic", // Fallback icon, won't be shown
      text: _("Hidden"),
      actionName: this.assembleAction, // Fallback action, won't be used
    },
  };

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    this.onStateChanged = this.onStateChanged.bind(this);
    this.init();
  }

  private init(): void {
    this.addEventListeners();
    mainStateController.init();
  }

  /**
   * Set the button mode/state
   * Updates the UI with the appropriate visual representation
   *
   * @param state The new button state
   */
  public setState(state: MainButtonState): void {
    mainStateController.setState(state);
  }

  /**
   * Get the current button state
   * Delegates to the controller
   */
  public getState(): MainButtonState {
    return mainStateController.getState();
  }

  /**
   * Set whether the code in the editor has changed since last assembly
   * Implements MainButtonWidget, delegates to controller
   */
  public setCodeChanged(changed: boolean): void {
    mainStateController.setCodeChanged(changed);
  }

  /**
   * Check if code has changed - delegated to controller
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
    return mainStateController.updateFromSimulatorState(state);
  }

  /**
   * Convenience method to get enabled state for actions
   * Delegates to the controller for platform-independent logic
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

  protected addEventListeners(): void {
    mainStateController.events.on("state-changed", this.onStateChanged);
  }

  protected onStateChanged(state: MainButtonState): void {
    console.log("onStateChanged", state);
    if (state === MainButtonState.HIDDEN) {
      // Hide the button with animation
      this._revealer.set_reveal_child(false);
      return;
    }

    // Show the button with animation
    this._revealer.set_reveal_child(true);

    // Update the button icon, tooltip, and action name
    const mode = this.buttonModes[state];
    this._button.set_icon_name(mode.iconName);
    this._button.set_tooltip_text(mode.text);
    // Default Gtk.Button doesn't support labels and icons at the same time,
    // but we could create a box containing both icon and label
    // this._button.set_label(mode.text);
    this._button.set_action_name(`win.${mode.actionName}`);
  }
}

GObject.type_ensure(MainButton.$gtype);
