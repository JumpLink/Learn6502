import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import Gio from '@girs/gio-2.0'

import { Learn } from './learn.ts'
import { Editor } from './editor.ts'
import { GameConsole } from './game-console.ts'
import { Debugger } from './debugger.ts'

import Template from './application-window.blp'
import { SimulatorState } from '@easy6502/6502'
import { RunButtonMode, RunButtonState } from '../types/index.ts'

export class ApplicationWindow extends Adw.ApplicationWindow {

  // Child widgets
  declare private _editor: Editor
  declare private _gameConsole: GameConsole
  declare private _learn: Learn
  declare private _menuButton: Gtk.MenuButton
  declare private _runButton: Adw.SplitButton
  declare private _stack: Adw.ViewStack
  declare private _switcherBar: Adw.ViewSwitcherBar
  declare private _debugger: Debugger
  declare private _toastOverlay: Adw.ToastOverlay

  private _codeChanged: boolean = false

  static {
    GObject.registerClass({
      GTypeName: 'ApplicationWindow',
      Template,
      InternalChildren: ['editor', 'gameConsole', 'learn', 'menuButton', 'runButton', 'stack', 'switcherBar', 'debugger', 'toastOverlay'],
    }, this);
  }

  private assembleAction = new Gio.SimpleAction({ name: 'assemble' });
  private runAction = new Gio.SimpleAction({ name: 'run' });
  private runSimulatorAction = new Gio.SimpleAction({ name: 'run-simulator' });
  private resumeSimulatorAction = new Gio.SimpleAction({ name: 'resume-simulator' });
  private pauseSimulatorAction = new Gio.SimpleAction({ name: 'pause-simulator' });
  private resetSimulatorAction = new Gio.SimpleAction({ name: 'reset-simulator' });

  private buttonModes: Record<RunButtonState, RunButtonMode> = {
    [RunButtonState.ASSEMBLE]: {
      iconName: 'build-alt-symbolic',
      tooltipText: _("Assemble"),
      actionName: 'assemble',
    },
    [RunButtonState.RUN]: {
      iconName: 'play-symbolic',
      tooltipText: _("Run"),
      actionName: 'run-simulator',
    },
    [RunButtonState.PAUSE]: {
      iconName: 'pause-symbolic',
      tooltipText: _("Pause"),
      actionName: 'pause-simulator',
    },
    [RunButtonState.RESUME]: {
      iconName: 'play-symbolic',
      tooltipText: _("Resume"),
      actionName: 'resume-simulator',
    },
    [RunButtonState.RESET]: {
      iconName: 'reset-symbolic',
      tooltipText: _("Reset"),
      actionName: 'reset-simulator',
    },
  }

  constructor(application: Adw.Application) {
    super({ application })
    this.setupGeneralSignalListeners();
    this.setupActions();
    this.setupRunButton();
    this.setupGameConsoleSignalListeners();
    this.setupKeyboardListener();
    this.setupLearnTutorialSignalListeners();
    this.setupEditorSignalListeners();
  }

  public get state(): SimulatorState {
    return this._gameConsole.simulator.state;
  }

  private setupLearnTutorialSignalListeners(): void {
    this._learn.connect('copy', (_learn: Learn, code: string) => {
      this.copyGameConsole(code);
    });
  }

  private setupEditorSignalListeners(): void {
    // Connect to text buffer's changed signal
    this._editor.connect('changed', () => {
      this._codeChanged = true;
      this.updateRunActions(this._gameConsole.simulator.state);
    });
  }

  private setupGeneralSignalListeners(): void {
    this.connect('close-request', this.onCloseRequest.bind(this));
  }

  private onCloseRequest(): void {
    this._gameConsole.close();
    this._debugger.close();
  }

  private setupActions(): void {
    // Build and assembly actions
    this.assembleAction.connect('activate', this.assembleGameConsole.bind(this));
    this.add_action(this.assembleAction);

    this.runAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(this.runAction);

    // Simulator control actions
    this.runSimulatorAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(this.runSimulatorAction);

    this.resumeSimulatorAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(this.resumeSimulatorAction);

    this.pauseSimulatorAction.connect('activate', this.stopGameConsole.bind(this));
    this.add_action(this.pauseSimulatorAction);

    this.resetSimulatorAction.connect('activate', this.resetAndRunGameConsole.bind(this));
    this.add_action(this.resetSimulatorAction);
  }

  private setupRunButton(): void {
    // Set up the button click handler
    this._runButton.connect('clicked', () => {
      this.handleRunButtonClick();
    });

    // Initial button setup
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  private runGameConsole(): void {
    console.log("[ApplicationWindow] runGameConsole");
    // Set the game console as the visible child in the stack
    this._stack.set_visible_child(this._gameConsole);
    this._gameConsole.run();
  }

  private stopGameConsole(): void {
    console.log("[ApplicationWindow] stopGameConsole");
    this._gameConsole.stop();
  }

  private resetGameConsole(): void {
    console.log("[ApplicationWindow] resetGameConsole");
    this._gameConsole.reset();
  }

  private assembleGameConsole(): void {
    this._debugger.reset();
    // Set the debugger as the visible child in the stack
    this._stack.set_visible_child(this._debugger);
    // Reset the code changed flag BEFORE assembling
    this._codeChanged = false;
    this._gameConsole.assemble(this._editor.code);
  }

  private copyGameConsole(code: string): void {
    this._editor.code = code;
    // Set the editor as the visible child in the stack
    this._stack.set_visible_child(this._editor);
    this._codeChanged = false; // Reset the code changed flag after setting code
  }

  private showToast(params: Partial<Adw.Toast.ConstructorProps>): void {
    const toast = new Adw.Toast(params);
    this._toastOverlay.add_toast(toast);
  }

  private updateDebugger(): void {
    this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
  }

  private setupGameConsoleSignalListeners(): void {
    this._gameConsole.connect('assemble-success', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.onSimulatorStateChange(this._gameConsole.simulator.state);

      this.showToast({
        title: "Assembled successfully"
      });
    })

    this._gameConsole.connect('assemble-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: "Assemble failed"
      });
    })

    this._gameConsole.connect('hexdump', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('disassembly', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('assemble-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('stop', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('start', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('reset', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('step', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      // If stepper is enabled, update the debug info and the monitor every step
      if (this._gameConsole.simulator.stepperEnabled) {
        this.updateDebugger();
      }
    })

    this._gameConsole.connect('multistep', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.updateDebugger();
    })

    this._gameConsole.connect('goto', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.updateDebugger();
    })

    this._gameConsole.connect('simulator-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('simulator-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: "Simulator failure"
      });
    })

    this._gameConsole.connect('labels-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('labels-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: "Labels failure"
      });
    })

    this._gameConsole.connect('gamepad-pressed', (_gameConsole, key) => {
      this._debugger.log(`Gamepad key pressed: ${key}`);
    })
  }

  private setupKeyboardListener(): void {
    // Add a controller to handle key events
    const keyController = new Gtk.EventControllerKey();
    this.add_controller(keyController);

    keyController.connect('key-pressed', (_controller, keyval, keycode, state) => {
      // Handle the key press event
      this.handleKeyPress(keyval);
      return false;
    });
  }

  private handleKeyPress(keyval: number): void {
    switch (keyval) {
      case Gdk.KEY_w:
      case Gdk.KEY_Up:
        this._gameConsole.gamepadPress('Up');
        break;
      case Gdk.KEY_s:
      case Gdk.KEY_Down:
        this._gameConsole.gamepadPress('Down');
        break;
      case Gdk.KEY_a:
      case Gdk.KEY_Left:
        this._gameConsole.gamepadPress('Left');
        break;
      case Gdk.KEY_d:
      case Gdk.KEY_Right:
        this._gameConsole.gamepadPress('Right');
        break;
      case Gdk.KEY_Return:
        this._gameConsole.gamepadPress('A');
        break;
      case Gdk.KEY_space:
        this._gameConsole.gamepadPress('B');
        break;
    }
  }

  private onSimulatorStateChange(state: SimulatorState): void {
    this.updateDebugger();
    this.updateRunActions(state);
  }

  private setButtonMode(state: RunButtonState): void {
    const actionName = this.buttonModes[state].actionName;
    this._runButton.set_icon_name(this.buttonModes[state].iconName);
    this._runButton.set_tooltip_text(this.buttonModes[state].tooltipText);
    this._runButton.set_action_name(`win.${actionName}`);
  }

  private updateRunActions(state: SimulatorState): RunButtonState {
    console.log("[ApplicationWindow] updateRunActions", state);

    // Check if editor has code
    const hasCode = this._editor.hasCode;

    // Default: disable most actions
    this.runAction.set_enabled(false);
    this.resumeSimulatorAction.set_enabled(false);
    this.pauseSimulatorAction.set_enabled(false);
    this.resetSimulatorAction.set_enabled(false);

    // Always enable assemble if there's code
    this.assembleAction.set_enabled(hasCode);

    // Clear the existing action for the main button
    this._runButton.set_action_name(null);

    let buttonState: RunButtonState;

    if (this._codeChanged) {
      buttonState = RunButtonState.ASSEMBLE;
      this.setButtonMode(buttonState);
      return buttonState;
    }

    switch (state) {
      case SimulatorState.INITIALIZED:
        buttonState = RunButtonState.ASSEMBLE;
        break;

      case SimulatorState.RUNNING:
      case SimulatorState.DEBUGGING:
        buttonState = RunButtonState.PAUSE;

        // Enable pause action
        this.pauseSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);

        // Also enable assemble if code has changed

        break;

      case SimulatorState.COMPLETED:
        buttonState = RunButtonState.RESET;

        // Enable run and reset actions
        this.runAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.PAUSED:
      case SimulatorState.DEBUGGING_PAUSED:
        buttonState = RunButtonState.RESUME;

        // Enable resume, run and reset actions
        this.resumeSimulatorAction.set_enabled(true);
        this.runAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.READY:
        buttonState = RunButtonState.RUN;

        // Enable run and reset actions
        this.runSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      default:
        throw new Error(`Unknown state: ${state}`);
    }

    this.setButtonMode(buttonState);
    return buttonState;
  }

  private resetAndRunGameConsole(): void {
    this.resetGameConsole();
    this.runGameConsole();
  }

  private handleRunButtonClick(): void {
    const state = this._gameConsole.simulator.state;

    // If code has changed, always assemble when button is clicked
    if (this._codeChanged && this._editor.code.trim().length > 0) {
      this.assembleGameConsole();
      return;
    }

    switch (state) {
      case SimulatorState.INITIALIZED:
        // Assemble the code
        this.activate_action(`win.${this.assembleAction.get_name()}`, null);
        break;
      case SimulatorState.READY:
        // Run the simulator
        this.activate_action(`win.${this.runSimulatorAction.get_name()}`, null);
        break;
      case SimulatorState.RUNNING:
      case SimulatorState.DEBUGGING:
        // Pause the simulator
        this.activate_action(`win.${this.pauseSimulatorAction.get_name()}`, null);
        break;
      case SimulatorState.PAUSED:
      case SimulatorState.DEBUGGING_PAUSED:
        // Resume the simulator
        this.activate_action(`win.${this.resumeSimulatorAction.get_name()}`, null);
        break;
      case SimulatorState.COMPLETED:
        // Reset and run the simulator
        this.activate_action(`win.${this.resetSimulatorAction.get_name()}`, null);
        break;
      default:
        console.error(`Unhandled state in handleRunButtonClick: ${state}`);
    }
  }
}

GObject.type_ensure(ApplicationWindow.$gtype)
