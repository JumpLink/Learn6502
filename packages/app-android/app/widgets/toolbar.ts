import { Adw } from "@gjsify/adwaita-nativescript";
import { buildInto, registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
// The GNOME app's own Blueprint: the vertical run/step/share strip shown beside the editor on wide windows.
import toolbarTree from "../../../app-gnome/src/widgets/toolbar.blp?shared-tree";
import { translate } from "~/utils/translate";

/** The GNOME app's `$Toolbar`. Its buttons fire the window's `win.*` actions. */
export class Toolbar extends Adw.Bin {
  constructor() {
    super();
    buildInto(this, toolbarTree, { translate });
  }
}

registerTemplateClass("Toolbar", Toolbar);
