import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { Tutorial } from './tutorial.ts'

import Template from './learn.ui?raw'

GObject.type_ensure(Tutorial.$gtype)

export interface Learn {
  // Child widgets
  _scrolledWindow: Gtk.ScrolledWindow
  _statusPage: Adw.StatusPage
}

export class Learn extends Adw.Bin {

  static {
    GObject.registerClass({
      GTypeName: 'Learn',
      Template,
      InternalChildren: ['scrolledWindow', 'statusPage']
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }
}
