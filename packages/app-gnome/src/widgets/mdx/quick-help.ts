import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import QuickHelpTemplate from '@learn6502/learn/dist/quick-help.ui?raw'
import { findIdsInXml } from '../../utils.ts'
import { MdxRenderer } from './mdx-renderer.ts'

/**
 * Quick help widget that renders the quick help MDX content.
 * The UI is generated from the `quick-help.mdx` file from the learn package.
 */
export class QuickHelp extends MdxRenderer {
  // Find all source view IDs in the template
  static SOURCE_VIEW_IDS = findIdsInXml('sourceView', QuickHelpTemplate)

  static {
    GObject.registerClass({
      GTypeName: 'QuickHelp',
      Template: QuickHelpTemplate,
      InternalChildren: [...QuickHelp.SOURCE_VIEW_IDS],
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupSourceViews(QuickHelp.SOURCE_VIEW_IDS)
  }
}

GObject.type_ensure(QuickHelp.$gtype)
