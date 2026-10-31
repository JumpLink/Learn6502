import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { Application, ApplicationSettings, Observable } from "@nativescript/core";
import type { EditorView, EditorEventMap } from "@learn6502/common-ui";
import { editorController } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";
import type { Adw } from "@gjsify/adwaita-nativescript";
import { padSheetForSystemInsets } from "@gjsify/adwaita-nativescript";
import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import type { Editor as EditorWidget } from "@learn6502/ui";
import { QuickHelpView } from "~/mdx/quick-help-view";
import { logger } from "~/utils";
// The shared editor's source view is `@learn6502/ui`'s; the builder arm teaches NativeScript what `GtkSourceView` is.
import "~/widgets/source-view";

// The `$QuickHelpView` the shared `editor.blp` names: its content is generated from the MDX per platform.
registerTemplateClass("QuickHelpView", QuickHelpView);

const SETTINGS_CODE = "editor.code";

/** A built screen: its root view, the shared widget behind it and optional show/hide lifecycle hooks. */
export interface ScreenModule<W = unknown> {
  view: View;
  /** The `@learn6502/ui` widget the shared main window controller drives. */
  widget: W;
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

  private _pane: EditorWidget | null = null;
  private releaseInsets: (() => void) | null = null;
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
    return this._pane ? this._pane.focus() : false;
  }

  private onControllerCodeChanged = (event: { code: string }): void => {
    this.notifyPropertyChange("code", event.code);
    this.events.dispatch("changed", event);
  };

  /** Adopt the shared `@learn6502/ui` editor the window built (the source view over the
   *  quick-help bottom sheet) and wire it to the controller (once). */
  build(pane: EditorWidget): EditorWidget {
    this._pane?.unbind();
    this._pane = pane;

    // The controller outlives the activity: the widget hands it its fresh source view on every
    // recreation, so nothing is left to re-init here.
    if (!this._initialized) {
      this.log.debug("Initializing editor controller");
      editorController.events.on("changed", this.onControllerCodeChanged);
      // A process killed in the background takes the controller with it; the text is kept in the
      // app settings when the app leaves the foreground.
      editorController.setCode(ApplicationSettings.getString(SETTINGS_CODE, ""));
      Application.on(Application.suspendEvent, () => this.save());
      this._initialized = true;
    }

    return pane;
  }

  /** The back button closes the quick-help sheet first. */
  closeSheet(): boolean {
    if (!editorController.helpVisible) return false;
    editorController.setHelpVisible(false);
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
    // `bottomSheet` is typed against the GJS Adw bindings; at run time it is the NativeScript sheet.
    this.releaseInsets =
      on && this._pane ? padSheetForSystemInsets(this._pane.bottomSheet as unknown as Adw.BottomSheet) : null;
  }

  /** Persist the code (called when leaving the editor screen or the app). */
  save(): void {
    editorController.saveState();
    ApplicationSettings.setString(SETTINGS_CODE, editorController.code);
  }
}

export const editorView = new Editor();

/** Wrap the `$Editor` the window built for the shell's Adw.ViewStack. */
export function buildEditorScreen(built: EditorWidget): ScreenModule<EditorWidget> {
  const widget = editorView.build(built);
  return {
    // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    view: asView(widget),
    widget,
    onHide: () => editorView.save(),
    onBack: () => editorView.closeSheet(),
    padSystemInsets: (on) => {
      editorView.padsSystemInsets = on;
    },
  };
}
