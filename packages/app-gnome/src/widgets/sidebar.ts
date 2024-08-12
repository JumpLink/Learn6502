import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import Template from './sidebar.ui?raw'

interface _Sidebar {
  // Child widgets
  // ..
}

class _Sidebar extends Adw.Bin {
  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }
}

export const Sidebar = GObject.registerClass(
  {
    GTypeName: 'Sidebar',
    Template,
    InternalChildren: []
  },
  _Sidebar
)
