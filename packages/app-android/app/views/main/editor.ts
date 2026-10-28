import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { Application, ApplicationSettings } from "@nativescript/core";
import { editorController } from "@learn6502/common-ui";
import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { Editor as EditorWidget } from "@learn6502/ui";
import { QuickHelpView } from "~/mdx/quick-help-view";
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
}

let current: EditorWidget | null = null;
let restored = false;

/** Persist the code (called when leaving the editor screen or the app). */
function save(): void {
  editorController.saveState();
  ApplicationSettings.setString(SETTINGS_CODE, editorController.code);
}

/** Build the editor screen for the shell's Adw.ViewStack. */
export function buildEditorScreen(widget: EditorWidget): ScreenModule<EditorWidget> {
  // The controller outlives the activity: the previous widget stops listening to it first.
  current?.unbind();
  current = widget;

  if (!restored) {
    // A process killed in the background takes the text with it; it is kept in the app settings
    // when the app leaves the foreground.
    editorController.setCode(ApplicationSettings.getString(SETTINGS_CODE, ""));
    Application.on(Application.suspendEvent, save);
    restored = true;
  }

  return {
    // The shared widget is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    view: asView(widget),
    widget,
    onHide: save,
  };
}
