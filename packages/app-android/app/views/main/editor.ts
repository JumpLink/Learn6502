import { Application, ApplicationSettings } from "@nativescript/core";
import { editorController } from "@learn6502/ui";
// The shared editor's source view is `@learn6502/ui`'s; the builder arm teaches NativeScript what `GtkSourceView` is.
import "~/widgets/source-view";

const SETTINGS_CODE = "editor.code";

let restored = false;

/**
 * A process killed in the background takes the text with it; it is kept in the app settings
 * when the app leaves the foreground. The controller outlives the activity, so once is enough.
 */
export function persistEditorCode(): void {
  if (restored) return;
  restored = true;
  editorController.setCode(ApplicationSettings.getString(SETTINGS_CODE, ""));
  Application.on(Application.suspendEvent, () => {
    editorController.saveState();
    ApplicationSettings.setString(SETTINGS_CODE, editorController.code);
  });
}
