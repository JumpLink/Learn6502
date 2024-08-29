import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import Template from '@easy6502/learn/dist/tutorial.ui?raw'

export interface Tutorial {
  // Child widgets
  //..
}

export class Tutorial extends Adw.Bin {

  static {
    GObject.registerClass({
      GTypeName: 'Tutorial',
      Template,
      InternalChildren: []
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }
}
