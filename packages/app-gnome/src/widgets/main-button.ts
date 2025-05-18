import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";

import { SimulatorState } from "@learn6502/6502";
import {
  MainButtonState,
  type MainButtonMode,
  type MainButtonWidget,
  mainButtonController,
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
  declare private _button: Adw.SplitButton;

  // Signals
  static {
    GObject.registerClass(
      {
        GTypeName: "MainButton",
        Template,
        InternalChildren: ["button"],
        Properties: {
          state: GObject.ParamSpec.string(
            "state",
            "State",
            "Current button state",
            GObject.ParamFlags.READWRITE,
            MainButtonState.ASSEMBLE
          ),
        },
        Signals: {
          "state-changed": {
            param_types: [GObject.TYPE_STRING],
          },
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
  };

  // Current state property
  private _state: MainButtonState = MainButtonState.ASSEMBLE;

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    this.init();
  }

  private init(): void {
    // Initialize with default state
    this.setMode(MainButtonState.ASSEMBLE);
  }

  /**
   * Set the button mode/state
   *
   * @param state The new button state
   */
  public setMode(state: MainButtonState): void {
    const mode = this.buttonModes[state];

    this._button.set_icon_name(mode.iconName);
    this._button.set_tooltip_text(mode.text);
    this._button.set_action_name(`win.${mode.actionName}`);

    this._state = state;
    this.notify("state");
    this.emit("state-changed", state);
  }

  /**
   * Get the current button state
   */
  public getState(): MainButtonState {
    return this._state;
  }

  /**
   * Set whether the code in the editor has changed since last assembly
   * Implements MainButtonWidget
   */
  public setCodeChanged(changed: boolean): void {
    // Update controller state
    mainButtonController.setCodeChanged(changed);

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setMode(MainButtonState.ASSEMBLE);
    }
  }

  /**
   * Check if code has changed - delegated to controller
   */
  public hasCodeChanged(): boolean {
    // We can't directly access controller's _codeChanged private property,
    // but we can infer the state by checking if updateFromSimulatorState
    // returns ASSEMBLE for a non-ASSEMBLE simulator state
    const testState = SimulatorState.RUNNING; // This should return PAUSE normally
    return (
      mainButtonController.updateFromSimulatorState(testState) ===
      MainButtonState.ASSEMBLE
    );
  }

  /**
   * Set the menu model for the button
   */
  public set_menu_model(menu_model: Gio.MenuModel): void {
    this._button.set_menu_model(menu_model);
  }

  /**
   * Update button based on simulator state
   * Implements MainButtonWidget - delegates to controller
   *
   * @param state Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainButtonState {
    // Use the mainButtonController to determine button state
    const buttonState = mainButtonController.updateFromSimulatorState(state);
    this.setMode(buttonState);
    return buttonState;
  }

  /**
   * Convenience method to get enabled state for an action
   * Uses the common controller for consistency
   */
  public static getActionEnabledState(
    simulatorState: SimulatorState,
    hasCode: boolean,
    codeChanged: boolean
  ) {
    return mainButtonController.getActionEnabledState(
      simulatorState,
      hasCode,
      codeChanged
    );
  }
}

GObject.type_ensure(MainButton.$gtype);
