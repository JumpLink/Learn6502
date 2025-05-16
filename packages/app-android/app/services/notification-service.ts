import { NotificationService as BaseNotificationService } from "@learn6502/common-ui";
import type { NotificationOptions, DialogOptions } from "@learn6502/common-ui";
import { Application } from "@nativescript/core";
import { alert, confirm } from "@nativescript/core/ui/dialogs";

/**
 * Android-specific implementation of the NotificationService
 * Uses NativeScript dialogs for notifications
 */
export class NotificationService extends BaseNotificationService {
  constructor() {
    super();
  }

  /**
   * Display a notification using Android Toast
   */
  protected displayNotification(options: NotificationOptions): void {
    // Configure toast properties
    const duration = options.timeout ? options.timeout * 1000 : 2000;

    // Use Android's native Toast API
    const context = Application.android.context;
    if (context) {
      const toast = android.widget.Toast.makeText(
        context,
        options.title,
        android.widget.Toast.LENGTH_SHORT
      );
      toast.show();
    }

    // If action is provided, there's no direct way to add an action to Toast
    // A more complex solution with Snackbar would be needed for actions
    if (options.action) {
      console.warn(
        "Toast actions not supported directly in Android. Consider using a dialog instead."
      );
    }
  }

  /**
   * Display a confirmation dialog using NativeScript confirm dialog
   */
  protected async displayConfirmDialog(
    options: DialogOptions
  ): Promise<boolean> {
    try {
      const result = await confirm({
        title: options.title,
        message: options.message,
        okButtonText: options.confirmLabel || "Confirm",
        cancelButtonText: options.cancelLabel || "Cancel",
      });

      return result;
    } catch (error) {
      console.error("Error showing confirm dialog:", error);
      return false;
    }
  }

  /**
   * Display an information dialog using NativeScript alert dialog
   */
  protected async displayInfoDialog(options: DialogOptions): Promise<void> {
    try {
      await alert({
        title: options.title,
        message: options.message,
        okButtonText: options.confirmLabel || "OK",
      });
    } catch (error) {
      console.error("Error showing info dialog:", error);
    }
  }
}
