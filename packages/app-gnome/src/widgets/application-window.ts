import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { Sidebar } from './sidebar.ts'
import { Editor } from './editor.ts'
import { GameConsole } from './game-console.ts'

import Template from './application-window.ui?raw'

// Ensure widgets are loaded and can be used in the XML
GObject.type_ensure(Sidebar.$gtype)
GObject.type_ensure(Editor.$gtype)
GObject.type_ensure(GameConsole.$gtype)

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
}

class _ApplicationWindow extends Adw.ApplicationWindow {
  constructor(application: Adw.Application) {
    super({ application })
    this._runButton?.connect('clicked', () => {
      console.log('runButton clicked')
      this._gameConsole?.assemble(this._editor.getBuffer().text);
      this._gameConsole?.run();
    })
  }
}

export const ApplicationWindow = GObject.registerClass(
  {
    GTypeName: 'ApplicationWindow',
    Template,
    InternalChildren: ['sidebar', 'editor', 'gameConsole', 'menuButton', 'toggleSidebarButton', 'runButton', 'stack', 'switcherBar', 'splitView'],
  },
  _ApplicationWindow
)
