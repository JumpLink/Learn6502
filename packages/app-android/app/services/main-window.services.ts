import { Application } from "@nativescript/core";
import { _, type MainWindowServices } from "@learn6502/ui";
import { createNativeScriptServices } from "./main-window.services.common";

function copyToClipboard(text: string): boolean {
  if (!Application.android) return false;
  const clipboardManager = Application.android.context.getSystemService(
    android.content.Context.CLIPBOARD_SERVICE
  ) as android.content.ClipboardManager;
  clipboardManager.setPrimaryClip(android.content.ClipData.newPlainText("6502 Code", text));
  return true;
}

/** Hand the editor's code to the Android share sheet; GNOME opens its own share dialog instead. */
function shareCode(code: string): void {
  const activity = Application.android?.foregroundActivity;
  if (!activity || !code) return;
  const intent = new android.content.Intent(android.content.Intent.ACTION_SEND);
  intent.setType("text/plain");
  intent.putExtra(android.content.Intent.EXTRA_TEXT, code);
  activity.startActivity(android.content.Intent.createChooser(intent, _("Share")));
}

/** What the shared main window asks of Android: SAF for files, the share sheet, app settings. */
export function createMainWindowServices(showHelp: () => void): MainWindowServices {
  return createNativeScriptServices(showHelp, { copyToClipboard, shareCode });
}
