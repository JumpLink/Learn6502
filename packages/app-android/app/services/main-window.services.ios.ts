import { ApplicationSettings, Utils } from "@nativescript/core";
import { FileService, notificationService, type MainWindowServices } from "@learn6502/ui";

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

const fileService = new FileService();

/** iOS counterpart of main-window.services.ts's `copyToClipboard`. */
function copyToClipboard(text: string): boolean {
  UIPasteboard.generalPasteboard.string = text;
  return true;
}

/** iOS counterpart of `shareCode`: the Files-app-style activity sheet instead of Android's chooser. */
function shareCode(code: string): void {
  const rootController = UIApplication.sharedApplication.keyWindow?.rootViewController;
  if (!rootController || !code) return;
  const activityController = new UIActivityViewController({
    activityItems: [code as unknown as NSObject],
    applicationActivities: [],
  });
  // On iPad `UIActivityViewController` is a popover and crashes without a source; the root
  // view/its bounds is the closest thing to "somewhere on screen" without a specific button.
  const popover = activityController.popoverPresentationController;
  if (popover) {
    popover.sourceView = rootController.view;
    popover.sourceRect = rootController.view.bounds;
  }
  rootController.presentViewControllerAnimatedCompletion(activityController, true, () => {});
}

/** What the shared main window asks of iOS: the shared file dialog, the share sheet, app settings. */
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
