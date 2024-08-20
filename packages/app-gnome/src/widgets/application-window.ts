import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { Sidebar } from './sidebar.ts'
import { Editor } from './editor.ts'
import { GameConsole } from './game-console.ts'
import { Debugger } from './debugger.ts'

import Template from './application-window.ui?raw'

// Ensure widgets are loaded and can be used in the XML
GObject.type_ensure(Sidebar.$gtype)
GObject.type_ensure(Editor.$gtype)
GObject.type_ensure(GameConsole.$gtype)
GObject.type_ensure(Debugger.$gtype)
interface _ApplicationWindow {
  // Child widgets
  _sidebar: InstanceType<typeof Sidebar>
  _editor: InstanceType<typeof Editor>
  _gameConsole: InstanceType<typeof GameConsole>
  _menuButton: Gtk.MenuButton
  _toggleSidebarButton: Gtk.ToggleButton
  _runButton: Adw.SplitButton
  _stack: Adw.ViewStack
  _switcherBar: Adw.ViewSwitcherBar
  _splitView: Adw.OverlaySplitView
  _debugger: InstanceType<typeof Debugger>
}

class _ApplicationWindow extends Adw.ApplicationWindow {
  constructor(application: Adw.Application) {
    super({ application })
    this._runButton.connect('clicked', () => {
      console.log('runButton clicked')
      this._debugger.reset();
      this._gameConsole.assemble(this._editor.getBuffer().text);
      this._gameConsole.run();
    })

    // Game console signals

    this._gameConsole.connect('assemble-success', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('assemble-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('hexdump', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('disassembly', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('assemble-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('stop', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('start', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('reset', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('step', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('multistep', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('simulator-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('simulator-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('labels-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })

    this._gameConsole.connect('labels-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger._messageConsole.log(signal.message);
      }
    })
  }
}

export const ApplicationWindow = GObject.registerClass(
  {
    GTypeName: 'ApplicationWindow',
    Template,
    InternalChildren: ['sidebar', 'editor', 'gameConsole', 'menuButton', 'toggleSidebarButton', 'runButton', 'stack', 'switcherBar', 'splitView', 'debugger'],
  },
  _ApplicationWindow
)
