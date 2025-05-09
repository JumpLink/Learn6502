import type { DialogOptions, NotificationOptions } from "../types";

/**
 * Common interface for notification services
 */
export interface NotificationService {
  /**
   * Shows a temporary notification/toast
   * @param options Options for the notification
   */
  showNotification(options: NotificationOptions): void;

  /**
   * Shows a confirmation dialog
   * @param options Options for the dialog
   * @returns Promise, resolved to true if the user confirms
   */
  showConfirmDialog(options: DialogOptions): Promise<boolean>;

  /**
   * Shows an information dialog
   * @param options Options for the dialog
   * @returns Promise, resolved when the dialog is closed
   */
  showInfoDialog(options: DialogOptions): Promise<void>;
}

/**
 * Base implementation of the NotificationService
 */
export abstract class BaseNotificationService implements NotificationService {
  /**
   * Shows a notification
   * @param options Options for the notification
   */
  public showNotification(options: NotificationOptions): void {
    this.displayNotification(options);
  }

  /**
   * Shows a confirmation dialog
   * @param options Options for the dialog
   * @returns Promise, resolved to true if the user confirms
   */
  public async showConfirmDialog(options: DialogOptions): Promise<boolean> {
    return this.displayConfirmDialog(options);
  }

  /**
   * Shows an information dialog
   * @param options Options for the dialog
   * @returns Promise, resolved when the dialog is closed
   */
  public async showInfoDialog(options: DialogOptions): Promise<void> {
    return this.displayInfoDialog(options);
  }

  /**
   * Helper method for info notifications
   * @param title Title of the notification
   * @param message Optional message
   * @param timeout Optional display duration in seconds
   */
  public info(title: string, message?: string, timeout?: number): void {
    this.showNotification({
      title,
      message,
      type: "info",
      timeout,
    });
  }

  /**
   * Helper method for success notifications
   * @param title Title of the notification
   * @param message Optional message
   * @param timeout Optional display duration in seconds
   */
  public success(title: string, message?: string, timeout?: number): void {
    this.showNotification({
      title,
      message,
      type: "success",
      timeout,
    });
  }

  /**
   * Helper method for warning notifications
   * @param title Title of the notification
   * @param message Optional message
   * @param timeout Optional display duration in seconds
   */
  public warning(title: string, message?: string, timeout?: number): void {
    this.showNotification({
      title,
      message,
      type: "warning",
      timeout,
    });
  }

  /**
   * Helper method for error notifications
   * @param title Title of the notification
   * @param message Optional message
   * @param timeout Optional display duration in seconds
   */
  public error(title: string, message?: string, timeout?: number): void {
    this.showNotification({
      title,
      message,
      type: "error",
      timeout,
    });
  }

  /**
   * Platform-specific implementation for notifications
   */
  protected abstract displayNotification(options: NotificationOptions): void;

  /**
   * Platform-specific implementation for confirmation dialogs
   */
  protected abstract displayConfirmDialog(
    options: DialogOptions
  ): Promise<boolean>;

  /**
   * Platform-specific implementation for information dialogs
   */
  protected abstract displayInfoDialog(options: DialogOptions): Promise<void>;
}
