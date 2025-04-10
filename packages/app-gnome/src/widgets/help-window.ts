import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { QuickHelp } from './mdx/quick-help.ts'

import Template from './help-window.blp'

export class HelpWindow extends Adw.Window {

  declare private _quickHelp: QuickHelp;

  static {
    GObject.registerClass({
        GTypeName: 'HelpWindow',
        Template,
        InternalChildren: ['quickHelp'],
    }, this);
  }

  constructor(params: Partial<Adw.Window.ConstructorProps> = {}) {
      super(params)
  }
}

GObject.type_ensure(HelpWindow.$gtype)