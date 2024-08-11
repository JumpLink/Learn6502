import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

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
  _sidebar: InstanceType<typeof Sidebar> | undefined
  _editor: InstanceType<typeof Editor> | undefined
  _gameConsole: InstanceType<typeof GameConsole> | undefined
}

class _ApplicationWindow extends Adw.ApplicationWindow {
  constructor(application: Adw.Application) {
    super({ application })
  }
}

export const ApplicationWindow = GObject.registerClass(
  {
    GTypeName: 'ApplicationWindow',
    Template,
    InternalChildren: ['sidebar', 'editor', 'gameConsole'],
  },
  _ApplicationWindow
)
