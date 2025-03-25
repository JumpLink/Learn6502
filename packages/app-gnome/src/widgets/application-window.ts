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

export class ApplicationWindow extends Adw.ApplicationWindow {

  // Child widgets
  declare private _editor: Editor
  declare private _gameConsole: GameConsole
  declare private _learn: Learn
  declare private _menuButton: Gtk.MenuButton
  declare private _buildButton: Gtk.MenuButton
  declare private _runButton: Adw.SplitButton
  declare private _stack: Adw.ViewStack
  declare private _switcherBar: Adw.ViewSwitcherBar
  declare private _debugger: Debugger
  declare private _toastOverlay: Adw.ToastOverlay

  static {
    GObject.registerClass({
      GTypeName: 'ApplicationWindow',
      Template,
      InternalChildren: ['editor', 'gameConsole', 'learn', 'menuButton', 'buildButton', 'runButton', 'stack', 'switcherBar', 'debugger', 'toastOverlay'],
    }, this);
  }

  constructor(application: Adw.Application) {
    super({ application })
    this.setupGeneralSignalListeners();
    this.setupBuildMenu();
    this.setupRunButton();
    this.setupGameConsoleSignalListeners();
    this.setupKeyboardListener();
    this.setupLearnTutorialSignalListeners();
  }

  public get state(): SimulatorState {
    return this._gameConsole.simulator.state;
  }

  private setupLearnTutorialSignalListeners(): void {
    this._learn.connect('copy-assemble-and-run', (_learn: Learn, code: string) => {
      this.copyGameConsole(code);
      this.assembleGameConsole();
      this.runGameConsole();
    });
    this._learn.connect('copy-assemble', (_learn: Learn, code: string) => {
      this.copyGameConsole(code);
      this.assembleGameConsole();
    });
    this._learn.connect('copy', (_learn: Learn, code: string) => {
      this.copyGameConsole(code);
    });
  }

  private setupGeneralSignalListeners(): void {
    this.connect('close-request', this.onCloseRequest.bind(this));
  }

  private onCloseRequest(): void {
    this._gameConsole.close();
    this._debugger.close();
  }

  private setupBuildMenu(): void {
    // TODO: Store latest action?
    this._buildButton.connect('clicked', this.runAndAssembleGameConsole.bind(this));

    const assembleAndRunAction = new Gio.SimpleAction({ name: 'assemble-and-run' });
    assembleAndRunAction.connect('activate', this.runAndAssembleGameConsole.bind(this));
    this.add_action(assembleAndRunAction);

    const assembleAction = new Gio.SimpleAction({ name: 'assemble' });
    assembleAction.connect('activate', this.assembleGameConsole.bind(this));
    this.add_action(assembleAction);

    const runAction = new Gio.SimpleAction({ name: 'run' });
    runAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(runAction);
  }

  private setupRunButton(): void {
    // Create actions for different simulator states
    const runAction = new Gio.SimpleAction({ name: 'run-simulator' });
    runAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(runAction);

    const resumeAction = new Gio.SimpleAction({ name: 'resume-simulator' });
    resumeAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(resumeAction);

    const pauseAction = new Gio.SimpleAction({ name: 'pause-simulator' });
    pauseAction.connect('activate', this.stopGameConsole.bind(this));
    this.add_action(pauseAction);

    const resetAction = new Gio.SimpleAction({ name: 'reset-simulator' });
    resetAction.connect('activate', this.resetAndRunGameConsole.bind(this));
    this.add_action(resetAction);

    // Set up the button click handler
    this._runButton.connect('clicked', () => {
      this.handleRunButtonClick();
    });

    // Initial button setup
    this.updateRunButtonState(this._gameConsole.simulator.state);
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
    this._gameConsole.assemble(this._editor.code);
  }

  private runAndAssembleGameConsole(): void {
    this.assembleGameConsole();
    this.runGameConsole();
  }

  private copyGameConsole(code: string): void {
    this._editor.code = code;
    // Set the editor as the visible child in the stack
    this._stack.set_visible_child(this._editor);
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
    this.updateRunButtonState(state);
  }

  private updateRunButtonState(state: SimulatorState): void {
    console.log("[ApplicationWindow] updateRunButtonState", state);

    // Get all actions
    const runAction = this.lookup_action('run-simulator') as Gio.SimpleAction;
    const resumeAction = this.lookup_action('resume-simulator') as Gio.SimpleAction;
    const pauseAction = this.lookup_action('pause-simulator') as Gio.SimpleAction;
    const resetAction = this.lookup_action('reset-simulator') as Gio.SimpleAction;

    // Default: disable all actions
    runAction.set_enabled(false);
    resumeAction.set_enabled(false);
    pauseAction.set_enabled(false);
    resetAction.set_enabled(false);

    // Clear the existing action for the main button
    this._runButton.set_action_name(null);

    switch (state) {
      case SimulatorState.INITIALIZED:
        console.log("[ApplicationWindow] Set the inactive button");
        // Show play button but disable it when no program is loaded
        this._runButton.set_icon_name('play-symbolic');
        this._runButton.set_tooltip_text(_("No program loaded"));
        this._runButton.set_sensitive(false);
        // All menu actions remain disabled
        break;

      case SimulatorState.RUNNING:
      case SimulatorState.DEBUGGING:
        console.log("[ApplicationWindow] Set the pause button");
        // Show pause button when running
        this._runButton.set_icon_name('pause-symbolic');
        this._runButton.set_tooltip_text(_("Pause"));
        this._runButton.set_sensitive(true);
        // Associate with pause action
        this._runButton.set_action_name('win.pause-simulator');

        // Enable only pause action
        pauseAction.set_enabled(true);
        resetAction.set_enabled(true);
        break;

      case SimulatorState.COMPLETED:
        console.log("[ApplicationWindow] Set the reset button");
        // Show reset button when program completed
        this._runButton.set_icon_name('reset-symbolic');
        this._runButton.set_tooltip_text(_("Reset"));
        this._runButton.set_sensitive(true);
        // Associate with reset and run action
        this._runButton.set_action_name('win.reset-simulator');

        // Enable run and reset actions
        runAction.set_enabled(true);
        resetAction.set_enabled(true);
        break;

      case SimulatorState.PAUSED:
      case SimulatorState.DEBUGGING_PAUSED:
        console.log("[ApplicationWindow] Set the run button");
        // Show play button when debugging is paused
        this._runButton.set_icon_name('play-symbolic');
        this._runButton.set_tooltip_text(_("Continue"));
        this._runButton.set_sensitive(true);
        // Associate with resume action
        this._runButton.set_action_name('win.resume-simulator');

        // Enable resume, run and reset actions
        resumeAction.set_enabled(true);
        runAction.set_enabled(true);
        resetAction.set_enabled(true);
        break;

      case SimulatorState.READY:
        console.log("[ApplicationWindow] Set the run button");
        // Show play button when ready
        this._runButton.set_icon_name('play-symbolic');
        this._runButton.set_tooltip_text(_("Run"));
        this._runButton.set_sensitive(true);
        // Associate with run action
        this._runButton.set_action_name('win.run-simulator');

        // Enable run and reset actions
        runAction.set_enabled(true);
        resetAction.set_enabled(true);
        break;

      default:
        throw new Error(`Unknown state: ${state}`);
    }
  }

  private resetAndRunGameConsole(): void {
    this.resetGameConsole();
    this.runGameConsole();
  }

  private handleRunButtonClick(): void {
    const state = this._gameConsole.simulator.state;

    switch (state) {
      case SimulatorState.INITIALIZED:
        // Button should be disabled in this state
        break;
      case SimulatorState.READY:
        // Run the simulator
        this.activate_action('win.run-simulator', null);
        break;
      case SimulatorState.RUNNING:
      case SimulatorState.DEBUGGING:
        // Pause the simulator
        this.activate_action('win.pause-simulator', null);
        break;
      case SimulatorState.PAUSED:
      case SimulatorState.DEBUGGING_PAUSED:
        // Resume the simulator
        this.activate_action('win.resume-simulator', null);
        break;
      case SimulatorState.COMPLETED:
        // Reset and run the simulator
        this.activate_action('win.reset-simulator', null);
        break;
      default:
        console.error(`Unhandled state in handleRunButtonClick: ${state}`);
    }
  }
}

GObject.type_ensure(ApplicationWindow.$gtype)
