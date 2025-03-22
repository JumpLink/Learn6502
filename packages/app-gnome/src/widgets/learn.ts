import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { Tutorial } from './tutorial.ts'

import Template from './learn.blp'

export class Learn extends Adw.Bin {

  // Child widgets
  declare private _scrolledWindow: Gtk.ScrolledWindow
  declare private _statusPage: Adw.StatusPage
  declare private _tutorial: Tutorial

  static {
    GObject.registerClass({
      GTypeName: 'Learn',
      Template,
      InternalChildren: ['scrolledWindow', 'statusPage', 'tutorial'],
      Signals: {
        'copy-assemble-and-run': {
          param_types: [GObject.TYPE_STRING],
        },
        'copy-assemble': {
          param_types: [GObject.TYPE_STRING],
        },
        'copy': {
          param_types: [GObject.TYPE_STRING],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupTutorialSignalListeners()
  }

  private setupTutorialSignalListeners(): void {
    this._tutorial.connect('copy-assemble-and-run', (tutorial, code) => {
      this.emit('copy-assemble-and-run', code);
    });
    this._tutorial.connect('copy-assemble', (tutorial, code) => {
      this.emit('copy-assemble', code);
    });
    this._tutorial.connect('copy', (tutorial, code) => {
      this.emit('copy', code);
    });
  }
}

GObject.type_ensure(Learn.$gtype)