import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";

import { SimulatorState } from "@learn6502/6502";
import {
  MainButtonState,
  type MainButtonMode,
  type MainButtonWidget,
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
  private _codeChanged: boolean = false;

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
    this._codeChanged = changed;

    // If code has changed, automatically set to ASSEMBLE mode
    if (changed) {
      this.setMode(MainButtonState.ASSEMBLE);
    }
  }

  /**
   * Check if code has changed
   */
  public hasCodeChanged(): boolean {
    return this._codeChanged;
  }

  /**
   * Set the menu model for the button
   */
  public set_menu_model(menu_model: Gio.MenuModel): void {
    this._button.set_menu_model(menu_model);
  }

  /**
   * Update button based on simulator state
   * Implements MainButtonWidget
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

    let buttonState: MainButtonState;

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

    this.setMode(buttonState);
    return buttonState;
  }

  /**
   * Convenience method to get enabled state for an action
   */
  public static getActionEnabledState(
    simulatorState: SimulatorState,
    hasCode: boolean,
    codeChanged: boolean
  ): {
    assemble: boolean;
    run: boolean;
    resume: boolean;
    pause: boolean;
    reset: boolean;
    step: boolean;
  } {
    // Default: disable all actions
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
      return enabledState;
    }

    switch (simulatorState) {
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
}

GObject.type_ensure(MainButton.$gtype);
