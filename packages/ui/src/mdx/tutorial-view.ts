import GObject from "@girs/gobject-2.0";
import type Adw from "@girs/adw-1";

import Template from "@learn6502/learn/dist/tutorial.blp?template";

import { learnController } from "../controller/index.ts";
import { MdxView } from "./mdx-view.ts";

/**
 * The step-by-step tutorial, generated from `tutorial.mdx` in `@learn6502/learn`.
 *
 * Its ~750 widgets are the most expensive thing the app builds, so it is NOT a template child of
 * `learn.blp`: {@link Learn} constructs it the first time the tutorial page is opened. A reader
 * who never opens it pays nothing, on every platform.
 *
 * @see [tutorial.mdx](packages/learn/src/tutorial.mdx)
 */
export class TutorialView extends MdxView {
  static {
    GObject.registerClass(
      {
        GTypeName: "TutorialView",
        Template,
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    // The shared Learn view only hosts the tutorial; handing its code to the editor is ours
    this.connect("copy", (_view, code) => learnController.dispatch("copy", { code }));
  }
}

GObject.type_ensure(TutorialView.$gtype);
