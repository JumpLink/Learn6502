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
  declare private _runButton: Gtk.Button
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
    // Create a toggle-run action
    const toggleRunAction = new Gio.SimpleAction({ name: 'toggle-run' });
    toggleRunAction.connect('activate', this.toggleRunGameConsole.bind(this));
    this.add_action(toggleRunAction);

    // Connect the clicked signal for the button
    this._runButton.connect('clicked', this.toggleRunGameConsole.bind(this));

    // Initial button setup
    this.updateRunButtonState();
  }

  private runGameConsole(): void {
    console.log("runGameConsole");
    // Set the game console as the visible child in the stack
    this._stack.set_visible_child(this._gameConsole);
    this._gameConsole.run();
  }

  private stopGameConsole(): void {
    console.log("stopGameConsole");
    this._gameConsole.stop();
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

  private setupGameConsoleSignalListeners(): void {
    this._gameConsole.connect('assemble-success', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

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
      this.onSimulatorStateChange();
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('start', (_gameConsole, signal) => {
      this.onSimulatorStateChange();
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('reset', (_gameConsole, signal) => {
      this.onSimulatorStateChange();
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
    })

    this._gameConsole.connect('step', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      // If stepper is enabled, update the debug info and the monitor every step
      if (this._gameConsole.simulator.stepperEnabled) {
        this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
      }
    })

    this._gameConsole.connect('multistep', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
    })

    this._gameConsole.connect('goto', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
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

  private onSimulatorStateChange(): void {
    this.updateRunButtonState();
  }

  private updateRunButtonState(): void {
    const state = this._gameConsole.simulator.state;

    console.log("updateRunButtonState", state);

    if (state === SimulatorState.RUNNING || state === SimulatorState.DEBUGGING) {
      // Show pause button when running
      this._runButton.set_icon_name('pause-symbolic');
      this._runButton.set_tooltip_text(_("Pause"));
      this._runButton.set_sensitive(true);
    } else if (state === SimulatorState.INITIALIZED) {
      // Show play button but disable it when no program is loaded
      this._runButton.set_icon_name('play-symbolic');
      this._runButton.set_tooltip_text(_("No program loaded"));
      this._runButton.set_sensitive(false);
    } else {
      // Show play button when ready, stopped or paused
      this._runButton.set_icon_name('play-symbolic');
      this._runButton.set_tooltip_text(_("Run"));
      this._runButton.set_sensitive(true);
    }
  }

  private toggleRunGameConsole(): void {
    const state = this._gameConsole.simulator.state;

    console.log("toggleRunGameConsole", state);

    if (state === SimulatorState.RUNNING || state === SimulatorState.DEBUGGING) {
      // Stop the simulator if it's running
      this.stopGameConsole();
    }

    // Set the game console as the visible child in the stack
    this.runGameConsole();
  }
}

GObject.type_ensure(ApplicationWindow.$gtype)