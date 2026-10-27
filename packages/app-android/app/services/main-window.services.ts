import { Application, ApplicationSettings, Utils } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { FileService, notificationService, type MainWindowServices } from "@learn6502/ui";
import { showError } from "~/utils";

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

const fileService = new FileService({
  onError: (message, error) => showError(error, { forcedMessage: message, showAsNotification: true }),
});

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
  return {
    files: {
      openFile: () => fileService.openFile(),
      saveFile: (content) => fileService.saveFile(content),
      saveFileAs: (content, suggestedName) => fileService.saveFileAs(content, suggestedName),
      getCurrentFileName: () => fileService.getCurrentFileName(),
      hasCurrentFile: () => fileService.hasCurrentFile(),
      hasUnsavedChanges: () => fileService.hasUnsavedChanges(),
      setUnsavedChanges: (hasChanges) => fileService.setUnsavedChanges(hasChanges),
    },
    settings: {
      getInt: (key) => ApplicationSettings.getNumber(key, 0),
      setInt: (key, value) => ApplicationSettings.setNumber(key, value),
      getBoolean: (key) => ApplicationSettings.getBoolean(key, false),
      setBoolean: (key, value) => ApplicationSettings.setBoolean(key, value),
    },
    clipboard: { copy: copyToClipboard },
    notifier: { show: (options) => notificationService.showNotification(options) },
    showHelp,
    showShareDialog: (code) => shareCode(code),
    submitExample: () => Utils.openUrl(SHARE_URL),
  };
}
