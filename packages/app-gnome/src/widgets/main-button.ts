import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";

import { SimulatorState } from "@learn6502/6502";
import {
  MainUiState,
  type MainButtonMode,
  type MainButtonWidget,
  mainStateController,
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
            MainUiState.ASSEMBLE
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
  private buttonModes: Record<MainUiState, MainButtonMode> = {
    [MainUiState.INITIAL]: {
      iconName: "build-alt-symbolic",
      text: _("Assemble"),
      actionName: this.assembleAction,
    },
    [MainUiState.ASSEMBLE]: {
      iconName: "build-alt-symbolic",
      text: _("Assemble"),
      actionName: this.assembleAction,
    },
    [MainUiState.RUN]: {
      iconName: "play-symbolic",
      text: _("Run"),
      actionName: this.runSimulatorAction,
    },
    [MainUiState.PAUSE]: {
      iconName: "pause-symbolic",
      text: _("Pause"),
      actionName: this.pauseSimulatorAction,
    },
    [MainUiState.RESUME]: {
      iconName: "play-symbolic",
      text: _("Resume"),
      actionName: this.resumeSimulatorAction,
    },
    [MainUiState.RESET]: {
      iconName: "reset-symbolic",
      text: _("Reset"),
      actionName: this.resetSimulatorAction,
    },
    [MainUiState.STEP]: {
      iconName: "step-over-symbolic",
      text: _("Step"),
      actionName: this.stepSimulatorAction,
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
  public setState(state: MainUiState): void {
    mainStateController.setState(state);
  }

  /**
   * Get the current button state
   * Delegates to the controller
   */
  public getState(): MainUiState {
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
   * Update button based on simulator state
   * Implements MainButtonWidget
   *
   * @param state Current simulator state
   * @returns The new button state
   */
  public updateFromSimulatorState(state: SimulatorState): MainUiState {
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

  protected onStateChanged(state: MainUiState): void {
    // Update the button icon, tooltip, and action name
    const mode = this.buttonModes[state];
    this._button.set_icon_name(mode.iconName);
    this._button.set_tooltip_text(mode.text);
    this._button.set_action_name(`win.${mode.actionName}`);
  }
}

GObject.type_ensure(MainButton.$gtype);
