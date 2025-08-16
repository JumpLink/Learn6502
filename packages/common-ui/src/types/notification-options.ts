import type { NotificationType } from "./index";

/**
 * Options for notifications
 */
export interface NotificationOptions {
  title: string;
  message?: string;
  type?: NotificationType;
  timeout?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}
