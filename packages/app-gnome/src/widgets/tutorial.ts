import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { findIdsInXml } from '../utils.ts'

import Template from '@easy6502/learn/dist/tutorial.ui?raw'

import { ExecutableSourceView } from './executable-source-view.ts'

// Custom widget used in the `tutorial.mdx`
GObject.type_ensure(ExecutableSourceView.$gtype)

export interface Tutorial {
  // Child widgets
  // _executableSourceView1: ExecutableSourceView
  // _executableSourceView2: ExecutableSourceView
  // _executableSourceView3: ExecutableSourceView
  // _executableSourceView4: ExecutableSourceView, ...
}

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
    this.setupCodeBlocks()
  }

  private setupCodeBlocks() {
    for (const id of executableSourceViewIds) {
      const executableSourceView = this.getExecutableSourceView(id)
      // Forward the signals to the parent widget
      executableSourceView.connect('copy-assemble-and-run', (sourceView: ExecutableSourceView, code: string) => {
        this.emit('copy-assemble-and-run', code)
      })
      executableSourceView.connect('copy-assemble', (sourceView: ExecutableSourceView, code: string) => {
        this.emit('copy-assemble', code)
      })
      executableSourceView.connect('copy', (sourceView: ExecutableSourceView, code: string) => {
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
