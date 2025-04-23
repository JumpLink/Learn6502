import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import TutorialTemplate from '@learn6502/learn/dist/tutorial.ui?raw'
import { findIdsInXml } from '../utils.ts'
import { MdxView } from './mdx-view.ts'

/**
 * The tutorial widget.
 * The UI is generated from the `tutorial.mdx` file from the learn package.
 * @see [tutorial.mdx](packages/learn/src/tutorial.mdx)
 * @see [gtk-code.component.tsx](packages/learn/src/components/gtk/gtk-code.component.tsx)
 */
export class TutorialView extends MdxView {

  // Find all source view IDs in the template
  static SOURCE_VIEW_IDS = findIdsInXml('sourceView', TutorialTemplate)

  static {

    GObject.registerClass({
      GTypeName: 'TutorialView',
      Template: TutorialTemplate,
      InternalChildren: [...TutorialView.SOURCE_VIEW_IDS],
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupSourceViews(TutorialView.SOURCE_VIEW_IDS)
  }
}

GObject.type_ensure(TutorialView.$gtype)
