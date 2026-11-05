import { ApplicationSettings, Utils } from "@nativescript/core";
import { FileService, notificationService, type MainWindowServices } from "@learn6502/ui";
import { showError } from "~/utils";

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

const fileService = new FileService({
  onError: (message, error) => showError(error, { forcedMessage: message }),
});

/** The two things the shared main window asks of the OS that Android and iOS answer differently. */
export interface PlatformSystemServices {
  copyToClipboard(text: string): boolean;
  shareCode(code: string): void;
}

/**
 * The main-window services both NativeScript platforms share: the shared file dialog, app settings
 * and notifications. `main-window.services.ts` (Android) and `main-window.services.ios.ts` only
 * add the clipboard and the share sheet.
 */
export function createNativeScriptServices(showHelp: () => void, system: PlatformSystemServices): MainWindowServices {
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
    clipboard: { copy: system.copyToClipboard },
    notifier: { show: (options) => notificationService.showNotification(options) },
    showHelp,
    showShareDialog: (code) => system.shareCode(code),
    submitExample: () => Utils.openUrl(SHARE_URL),
  };
}
