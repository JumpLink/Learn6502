import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { Observable } from "@nativescript/core";
import type { EditorView, EditorEventMap } from "@learn6502/common-ui";
import { editorController } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";
import type { SourceView } from "~/widgets/source-view";
import { EditorPane } from "~/widgets/editor-pane";
import { logger } from "~/utils";

/** A built screen: its root view + optional show/hide lifecycle hooks. */
export interface ScreenModule {
  view: View;
  onShow?(): void;
  onHide?(): void;
  /** Handle the hardware back button while this screen is active. Return true if
   *  the screen consumed it (e.g. popped an internal navigation stack). */
  onBack?(): boolean;
  /** Clear (or stop clearing) the gesture area at the screen's bottom edge, as the wide layout needs. */
  padSystemInsets?(on: boolean): void;
}

/**
 * Editor view — implements EditorView from common-ui. The editor is a content
 * view (a SourceView) added to the shell's Adw.ViewStack, not a page of its own.
 * All editing logic still lives in editorController.
 */
class Editor extends Observable implements EditorView {
  readonly events: EventDispatcher<EditorEventMap> = new EventDispatcher<EditorEventMap>();

  private _sourceView: SourceView | null = null;
  private _pane: EditorPane | null = null;
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

  /** Build the editor from the GNOME app's `editor.blp` (the source view over the quick-help
   *  bottom sheet) and wire it to the controller (once). */
  build(): View {
    const pane = new EditorPane();
    const sourceView = pane.sourceView;
    sourceView.editable = true;
    sourceView.lineNumbers = true;
    this._sourceView = sourceView;
    this._pane = pane;

    if (!this._initialized) {
      this.log.debug("Initializing editor controller");
      editorController.init(sourceView);
      editorController.events.on("changed", this.onControllerCodeChanged);
      this._initialized = true;
    }

    return asView(pane);
  }

  /** The back button closes the quick-help sheet first. */
  closeSheet(): boolean {
    return this._pane?.closeSheet() ?? false;
  }

  /** Whether the editor reaches the screen's bottom edge (the wide layout): see {@link EditorPane}. */
  set padsSystemInsets(on: boolean) {
    if (this._pane) this._pane.padsSystemInsets = on;
  }

  /** Persist the code (called when leaving the editor screen). */
  save(): void {
    editorController.saveState();
  }
}

export const editorView = new Editor();

/** Build the editor screen for the shell's Adw.ViewStack. */
export function buildEditorScreen(): ScreenModule {
  return {
    view: editorView.build(),
    onHide: () => editorView.save(),
    onBack: () => editorView.closeSheet(),
    padSystemInsets: (on) => {
      editorView.padsSystemInsets = on;
    },
  };
}
