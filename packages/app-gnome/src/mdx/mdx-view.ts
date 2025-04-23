import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { SourceView } from '../widgets/source-view.ts'

/**
 * Base class for rendering MDX content in GTK
 * Provides common functionality for handling source views and other MDX elements
 * This class is designed to be extended by concrete implementations with specific templates
 */
export class MdxView extends Adw.Bin {
  static {
    GObject.registerClass({
      GTypeName: 'MdxView',
      Signals: {
        'copy': {
          param_types: [GObject.TYPE_STRING],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    // Prevent direct instantiation of the base class
    if (this.constructor === MdxView) {
      throw new Error('MdxView is a base class and should not be instantiated directly')
    }
  }

  protected setupSourceViews(sourceViewIds: string[]) {
    for (const id of sourceViewIds) {
      const sourceView = this.getSourceView(id)
      // TODO: Disconnect the signal when the source view is destroyed
      sourceView.connect('copy', (_sourceView: SourceView, code: string) => {
        this.emit('copy', code)
      })
    }
  }

  protected getSourceView(id: string): SourceView {
    const propertyName = `_${id}` as keyof this
    if (propertyName in this) {
      return this[propertyName] as unknown as SourceView
    }
    throw new Error(`SourceView with id ${id} not found`)
  }
}

GObject.type_ensure(MdxView.$gtype)
