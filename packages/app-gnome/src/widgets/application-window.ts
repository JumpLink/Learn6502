import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import Gio from '@girs/gio-2.0'

import { Learn } from './learn.ts'
import { Editor } from './editor.ts'
import { GameConsole } from './game-console.ts'
import { Debugger } from './debugger.ts'

import Template from './application-window.ui?raw'

// Ensure widgets are loaded and can be used in the XML
GObject.type_ensure(Learn.$gtype)
GObject.type_ensure(Editor.$gtype)
GObject.type_ensure(GameConsole.$gtype)
GObject.type_ensure(Debugger.$gtype)

export interface ApplicationWindow {
  // Child widgets
  _editor: Editor
  _gameConsole: GameConsole
  _learn: Learn
  _menuButton: Gtk.MenuButton
  _runButton: Adw.SplitButton
  _stack: Adw.ViewStack
  _switcherBar: Adw.ViewSwitcherBar
  _debugger: Debugger
  _toastOverlay: Adw.ToastOverlay
}

export class ApplicationWindow extends Adw.ApplicationWindow {

  static {
    GObject.registerClass({
      GTypeName: 'ApplicationWindow',
      Template,
      InternalChildren: ['editor', 'gameConsole', 'learn', 'menuButton', 'runButton', 'stack', 'switcherBar', 'debugger', 'toastOverlay'],
    }, this);
  }

  constructor(application: Adw.Application) {
    super({ application })
    this.setupRunMenu();
    this.setupGameConsoleSignalListeners();
    this.setupKeyboardListener();
  }

  private setupRunMenu(): void {

    // TODO: Store latest action?
    this._runButton.connect('clicked', this.runAndAssembleGameConsole.bind(this));

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

  private runGameConsole(): void {
    this._gameConsole.run();
  }

  private assembleGameConsole(): void {
    this._debugger.reset();
    this._gameConsole.assemble(this._editor.text);
  }

  private runAndAssembleGameConsole(): void {
    this.assembleGameConsole();
    this.runGameConsole();
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
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('start', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('reset', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
    })

    this._gameConsole.connect('step', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

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
}
