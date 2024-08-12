import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import Template from './game-console.ui?raw'

interface _GameConsole {
  // Child widgets
  // ..
}

class _GameConsole extends Adw.Bin {
  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }
}

export const GameConsole = GObject.registerClass(
  {
    GTypeName: 'GameConsole',
    Template,
    InternalChildren: []
  },
  _GameConsole
)
