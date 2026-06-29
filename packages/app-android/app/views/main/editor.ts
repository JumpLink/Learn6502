import type { View } from "@nativescript/core";
import { Observable, ScrollView } from "@nativescript/core";
import { AdwBottomSheet, AdwClamp } from "@gjsify/adwaita-nativescript";
import type { EditorView, EditorEventMap } from "@learn6502/common-ui";
import { editorController } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";
import { SourceView } from "~/widgets/source-view";
import { QuickHelpView } from "~/mdx/quick-help-view";
import { logger } from "~/utils";

/** A built screen: its root view + optional show/hide lifecycle hooks. */
export interface ScreenModule {
  view: View;
  onShow?(): void;
  onHide?(): void;
  /** Handle the hardware back button while this screen is active. Return true if
   *  the screen consumed it (e.g. popped an internal navigation stack). */
  onBack?(): boolean;
}

/**
 * Editor view — implements EditorView from common-ui. The Material Page+ActionBar
 * is gone; the editor is now a content view (a SourceView) added to the shell's
 * AdwViewStack. All editing logic still lives in editorController.
 */
class Editor extends Observable implements EditorView {
  readonly events: EventDispatcher<EditorEventMap> = new EventDispatcher<EditorEventMap>();

  private _sourceView: SourceView | null = null;
  private _initialized = false;
  private log = logger.scoped("Editor");

  get code(): string {
    return editorController.code;
  }

  set code(value: string) {
    this.setCode(value);
  }

  setCode(value: string): void {
    editorController.setCode(value);
    this.notifyPropertyChange("code", value);
  }

  get hasCode(): boolean {
    return editorController.hasCode;
  }

  addContent(content: string): void {
    editorController.addContent(content);
  }

  clear(): void {
    editorController.clear();
  }

  focus(): boolean {
    return this._sourceView ? this._sourceView.focus() : false;
  }

  private onControllerCodeChanged = (event: { code: string }): void => {
    this.notifyPropertyChange("code", event.code);
    this.events.dispatch("changed", event);
  };

  /** Build the SourceView wrapped in an Adwaita bottom sheet (the GNOME editor's
   *  Adw.BottomSheet: the source view as content, the quick-help reference as the
   *  draggable sheet), and wire it to the controller (once). */
  build(): View {
    const sourceView = new SourceView();
    sourceView.editable = true;
    sourceView.lineNumbers = true;
    // Fill the stack cell (NS-idiomatic + properly typed, unlike a "100%" string).
    sourceView.horizontalAlignment = "stretch";
    sourceView.verticalAlignment = "stretch";
    this._sourceView = sourceView;

    if (!this._initialized) {
      this.log.debug("Initializing editor controller");
      editorController.init(sourceView);
      editorController.events.on("changed", this.onControllerCodeChanged);
      this._initialized = true;
    }

    // GNOME wraps the editor in an Adw.BottomSheet whose sheet is the quick help
    // (a ScrolledWindow > Adw.Clamp > QuickHelpView). The NS AdwBottomSheet opens
    // via its drag handle (no separate "Help" bottom-bar button).
    const sheet = new AdwBottomSheet();
    sheet.setContent(sourceView);

    const helpClamp = new AdwClamp();
    helpClamp.maximumSize = 600;
    const helpScroll = new ScrollView();
    helpScroll.content = new QuickHelpView();
    helpClamp.setChild(helpScroll);
    sheet.setSheet(helpClamp);

    return sheet;
  }

  /** Persist the code (called when leaving the editor screen). */
  save(): void {
    editorController.saveState();
  }
}

export const editorView = new Editor();

/** Build the editor screen for the shell's AdwViewStack. */
export function buildEditorScreen(): ScreenModule {
  return {
    view: editorView.build(),
    onHide: () => editorView.save(),
  };
}
