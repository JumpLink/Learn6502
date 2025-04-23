import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import QuickHelpTemplate from '@learn6502/learn/dist/quick-help.ui?raw'
import { findIdsInXml } from '../utils.ts'
import { MdxView } from './mdx-view.ts'

/**
 * Quick help widget that renders the quick help MDX content.
 * The UI is generated from the `quick-help.mdx` file from the learn package.
 */
export class QuickHelpView extends MdxView {
  // Find all source view IDs in the template
  static SOURCE_VIEW_IDS = findIdsInXml('sourceView', QuickHelpTemplate)

  static {
    GObject.registerClass({
      GTypeName: 'QuickHelpView',
      Template: QuickHelpTemplate,
      InternalChildren: [...QuickHelpView.SOURCE_VIEW_IDS],
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupSourceViews(QuickHelpView.SOURCE_VIEW_IDS)
  }
}

GObject.type_ensure(QuickHelpView.$gtype)
