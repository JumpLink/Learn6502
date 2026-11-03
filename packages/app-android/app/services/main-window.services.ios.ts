import type { MainWindowServices } from "@learn6502/ui";
import { createNativeScriptServices } from "./main-window.services.common";

/** iOS counterpart of main-window.services.ts's `copyToClipboard`. */
function copyToClipboard(text: string): boolean {
  UIPasteboard.generalPasteboard.string = text;
  return true;
}

/** iOS counterpart of `shareCode`: the share sheet instead of Android's chooser. */
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
  return createNativeScriptServices(showHelp, { copyToClipboard, shareCode });
}
