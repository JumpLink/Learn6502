import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";
import { NotificationService as BaseNotificationService } from "@learn6502/common-ui";
import type { NotificationOptions, DialogOptions } from "@learn6502/common-ui";
import { _ } from "./translate.ts";

/**
 * The NotificationService of every platform: toasts through `Adw.Toast` on the window's
 * `Adw.ToastOverlay`, dialogs through `Adw.AlertDialog`.
 */
class NotificationService extends BaseNotificationService {
  private window: Gtk.Window | null = null;
  private toastOverlay: Adw.ToastOverlay | null = null;

  public init(window: Gtk.Window, toastOverlay: Adw.ToastOverlay): void {
    this.window = window;
    this.toastOverlay = toastOverlay;
  }

  /**
   * Display a notification using Adw.Toast
   */
  protected displayNotification(options: NotificationOptions): void {
    const toastProperties: Partial<Adw.Toast.ConstructorProps> = {
      title: options.title,
      timeout: options.timeout || 2,
    };

    if (options.action) {
      toastProperties.button_label = options.action.label;
    }

    const toast = new Adw.Toast(toastProperties);

    if (options.action) {
      toast.connect("button-clicked", options.action.callback);
    }

    this.toastOverlay?.add_toast(toast);
  }

  /**
   * Display a confirmation dialog using Adw.AlertDialog
   */
  protected async displayConfirmDialog(options: DialogOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const dialog = new Adw.AlertDialog({
        heading: options.title,
        body: options.message,
        close_response: "cancel",
        default_response: "confirm",
      });

      // TRANSLATORS: Generic confirmation dialog button label
      dialog.add_response("cancel", options.cancelLabel || _("Cancel"));
      // TRANSLATORS: Generic confirmation dialog button label
      dialog.add_response("confirm", options.confirmLabel || _("Confirm"));

      dialog.connect("response", (_dialog, response) => {
        resolve(response === "confirm");
      });

      dialog.present(this.window);
    });
  }

  /**
   * Display an information dialog using Adw.AlertDialog
   */
  protected async displayInfoDialog(options: DialogOptions): Promise<void> {
    return new Promise<void>((resolve) => {
      const dialog = new Adw.AlertDialog({
        heading: options.title,
        body: options.message,
        close_response: "close",
        default_response: "close",
      });

      // TRANSLATORS: Alert dialog response button label to confirm an action
      dialog.add_response("close", options.confirmLabel || _("OK"));

      dialog.connect("response", () => {
        resolve();
      });

      dialog.present(this.window);
    });
  }
}

export const notificationService = new NotificationService();
