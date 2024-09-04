import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import Template from '@easy6502/learn/dist/tutorial.ui?raw'

import { ExecutableSourceView } from './executable-source-view.ts'

// Custom widget used in the `tutorial.mdx`
GObject.type_ensure(ExecutableSourceView.$gtype)

export interface Tutorial {
  // Child widgets
  //..
}

/**
 * The tutorial widget.
 * The ui is generated from the `tutorial.mdx` file from the learn package.
 * @see [tutorial.mdx](packages/learn/src/tutorial.mdx)
 * @see [gtk-code.component.tsx](packages/learn/src/components/gtk/gtk-code.component.tsx)
 */
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
