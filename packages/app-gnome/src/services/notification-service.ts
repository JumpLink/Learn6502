import { BaseNotificationService } from "@learn6502/common-ui";
import type { NotificationOptions, DialogOptions } from "@learn6502/common-ui";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

/**
 * GNOME-specific implementation of the NotificationService
 * Uses Adw.Toast and Adw.AlertDialog
 */
export class NotificationService extends BaseNotificationService {
  private window: Gtk.Window;
  private toastOverlay: Adw.ToastOverlay;

  constructor(window: Gtk.Window, toastOverlay: Adw.ToastOverlay) {
    super();
    this.window = window;
    this.toastOverlay = toastOverlay;
  }

  /**
   * Display a notification using Adw.Toast
   */
  protected displayNotification(options: NotificationOptions): void {
    // Configure toast properties
    const toastProperties: any = {
      title: options.title,
      timeout: options.timeout || 2,
    };

    // Add action button if an action is provided
    if (options.action) {
      toastProperties.button_label = options.action.label;
    }

    // Create and display toast
    const toast = new Adw.Toast(toastProperties);

    // Register action callback if provided
    if (options.action) {
      toast.connect("button-clicked", options.action.callback);
    }

    // Add toast to overlay
    this.toastOverlay.add_toast(toast);
  }

  /**
   * Display a confirmation dialog using Adw.AlertDialog
   */
  protected async displayConfirmDialog(
    options: DialogOptions
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Create dialog
      const dialog = new Adw.AlertDialog({
        heading: options.title,
        body: options.message,
        close_response: "cancel",
        default_response: "confirm",
      });

      // Add response buttons
      dialog.add_response("cancel", options.cancelLabel || _("Cancel"));
      dialog.add_response("confirm", options.confirmLabel || _("Confirm"));

      // Event handler for response
      dialog.connect("response", (_dialog, response) => {
        resolve(response === "confirm");
      });

      // Show dialog
      dialog.present(this.window);
    });
  }

  /**
   * Display an information dialog using Adw.AlertDialog
   */
  protected async displayInfoDialog(options: DialogOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      // Create dialog
      const dialog = new Adw.AlertDialog({
        heading: options.title,
        body: options.message,
        close_response: "close",
        default_response: "close",
      });

      // Add OK button
      dialog.add_response("close", options.confirmLabel || _("OK"));

      // Event handler for response
      dialog.connect("response", () => {
        resolve();
      });

      // Show dialog
      dialog.present(this.window);
    });
  }
}
