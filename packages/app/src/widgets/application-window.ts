import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import { Sidebar } from './sidebar.ts'

import Template from './application-window.ui?raw'

// Ensure widgets are loaded and can be used in the XML
GObject.type_ensure(Sidebar.$gtype)

interface _ApplicationWindow {
  // Child widgets
  _sidebar: InstanceType<typeof Sidebar> | undefined
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
    InternalChildren: [],
  },
  _ApplicationWindow
)
