import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { findIdsInXml } from '../utils.ts'

import Template from '@easy6502/learn/dist/tutorial.ui?raw'

import { ExecutableSourceView } from './executable-source-view.ts'

// Find all the ids in the template that match the id of the ExecutableSourceView
const executableSourceViewIds = findIdsInXml('executableSourceView', Template)

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
      InternalChildren: [...executableSourceViewIds],
      Signals: {
        'copy': {
          param_types: [GObject.TYPE_STRING],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupCodeBlocks()
  }

  private setupCodeBlocks() {
    for (const id of executableSourceViewIds) {
      const executableSourceView = this.getExecutableSourceView(id)
      executableSourceView.connect('copy', (_sourceView: ExecutableSourceView, code: string) => {
        this.emit('copy', code)
      })
    }
  }

  private getExecutableSourceView(id: string): ExecutableSourceView {
    const propertyName = `_${id}` as keyof Tutorial
    if (propertyName in this) {
      return this[propertyName] as unknown as ExecutableSourceView
    }
    throw new Error(`ExecutableSourceView with id ${id} not found`)
  }
}

GObject.type_ensure(Tutorial.$gtype)
