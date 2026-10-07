import { Adw, padSheetForSystemInsets } from "@gjsify/adwaita-nativescript";
import { buildInto, registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
// The GNOME app's own Blueprint: the source view over an `Adw.BottomSheet` whose bottom bar is "Help".
import editorTree from "../../../app-gnome/src/views/main/editor.blp?shared-tree";
import { QuickHelpView } from "~/mdx/quick-help-view";
import { translate } from "~/utils/translate";
import { SourceView } from "./source-view";

// The `$QuickHelpView` the blueprint names (`$SourceView` registers itself with its class).
registerTemplateClass("QuickHelpView", QuickHelpView);

/**
 * The GNOME app's `$Editor`, built from `editor.blp`: the source view with the quick-help sheet
 * under it. The Help bar is what opens the sheet.
 */
export class EditorPane extends Adw.Bin {
  readonly sourceView: SourceView;
  private readonly bottomSheet: Adw.BottomSheet;
  private releaseInsets: (() => void) | null = null;

  constructor() {
    super();
    buildInto(this, editorTree, { translate });
    this.sourceView = this.getViewById<SourceView>("sourceView");
    this.bottomSheet = this.getViewById<Adw.BottomSheet>("bottomSheet");
  }

  /** Close the quick-help sheet if it is open; true when it was (the back button is then used up). */
  closeSheet(): boolean {
    if (!this.bottomSheet.open) return false;
    this.bottomSheet.open = false;
    return true;
  }

  /**
   * Whether the editor sits on the screen's bottom edge, as in the wide layout. The Help bar
   * then clears the gesture area while the open sheet scrolls its quick help under it — which
   * of the two is the shape at the edge is the sheet's own business, so it takes the number
   * rather than a padding. The shared Blueprint says nothing of this — GTK has no insets.
   */
  set padsSystemInsets(on: boolean) {
    this.releaseInsets?.();
    this.releaseInsets = on ? padSheetForSystemInsets(this.bottomSheet) : null;
  }
}
