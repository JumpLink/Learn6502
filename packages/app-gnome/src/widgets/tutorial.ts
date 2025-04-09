import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { findIdsInXml } from '../utils.ts'

import Template from '@learn6502/learn/dist/tutorial.ui?raw'

import { SourceView } from './source-view.ts'

// Find all the ids in the template that match the id of the ExecutableSourceView
const sourceViewIds = findIdsInXml('sourceView', Template)

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
      InternalChildren: [...sourceViewIds],
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
    for (const id of sourceViewIds) {
      const sourceView = this.getSourceView(id)
      sourceView.connect('copy', (_sourceView: SourceView, code: string) => {
        this.emit('copy', code)
      })
    }
  }

  private getSourceView(id: string): SourceView {
    const propertyName = `_${id}` as keyof Tutorial
    if (propertyName in this) {
      return this[propertyName] as unknown as SourceView
    }
    throw new Error(`SourceView with id ${id} not found`)
  }
}

GObject.type_ensure(Tutorial.$gtype)
