import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import { Display } from './display.ts'

import Template from './game-console.ui?raw'

GObject.type_ensure(Display.$gtype)

interface _GameConsole {
  // Child widgets
  _display: InstanceType<typeof Display> | undefined
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
    InternalChildren: ['display']
  },
  _GameConsole
)
