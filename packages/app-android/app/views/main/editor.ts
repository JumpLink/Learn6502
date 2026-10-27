import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { Application, ApplicationSettings } from "@nativescript/core";
import { editorController } from "@learn6502/common-ui";
import type { Adw } from "@gjsify/adwaita-nativescript";
import { padSheetForSystemInsets } from "@gjsify/adwaita-nativescript";
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
  /** Clear (or stop clearing) the gesture area at the screen's bottom edge, as the wide layout needs. */
  padSystemInsets?(on: boolean): void;
}

let current: EditorWidget | null = null;
let releaseInsets: (() => void) | null = null;
let restored = false;

/** Persist the code (called when leaving the editor screen or the app). */
function save(): void {
  editorController.saveState();
  ApplicationSettings.setString(SETTINGS_CODE, editorController.code);
}

/**
 * Whether the editor sits on the screen's bottom edge, as in the wide layout. The Help bar
 * then clears the gesture area while the open sheet scrolls its quick help under it — which
 * of the two is the shape at the edge is the sheet's own business, so it takes the number
 * rather than a padding. The shared Blueprint says nothing of this — GTK has no insets.
 */
function padSystemInsets(widget: EditorWidget, on: boolean): void {
  releaseInsets?.();
  // `bottomSheet` is typed against the GJS Adw bindings; at run time it is the NativeScript sheet.
  releaseInsets = on ? padSheetForSystemInsets(widget.bottomSheet as unknown as Adw.BottomSheet) : null;
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
    padSystemInsets: (on) => padSystemInsets(widget, on),
  };
}
