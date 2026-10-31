import GObject from "@girs/gobject-2.0";

import Template from "@learn6502/learn/dist/quick-help.blp?template";

import { MdxView } from "./mdx-view.ts";

/**
 * The 6502 reference beside the editor, generated from `quick-help.mdx` in `@learn6502/learn`.
 *
 * The `$QuickHelpView` that `editor.blp` and `help-window.blp` name: importing this module is
 * what makes the name resolve, on every platform. Its copy buttons go nowhere — the code is
 * already in the editor next to it.
 *
 * @see [quick-help.mdx](packages/learn/src/quick-help.mdx)
 */
export class QuickHelpView extends MdxView {
  static {
    GObject.registerClass(
      {
        GTypeName: "QuickHelpView",
        Template,
      },
      this
    );
  }
}

GObject.type_ensure(QuickHelpView.$gtype);
