import type { NotificationType } from "./index";

/**
 * Options for dialogs
 */
export interface DialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: NotificationType;
}
