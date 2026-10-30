/**
 * Error reporting for the Android shell: log, then tell the user with a notification.
 */

import { notificationService } from "@learn6502/ui";

/** Show an error as a notification; `forcedMessage` replaces the error's own message. */
export function showError(err: unknown, options: { forcedMessage?: string } = {}): void {
  const error = err instanceof Error ? err : new Error(String(err));
  const message = options.forcedMessage || error.message;
  console.error("[ErrorHandler]", message, error);
  notificationService.showNotification({ title: message, timeout: 3 });
}

/** Route uncaught JS errors to {@link showError} and keep NativeScript from crashing the app. */
export function setupGlobalErrorHandler(): void {
  (globalThis as { __errorHandler?: unknown }).__errorHandler = (
    error: Error | null | undefined,
    nativeError?: unknown
  ) => {
    if (nativeError) console.error("[GlobalErrorHandler]", "Native error:", nativeError);
    if (error) showError(error);
    return true;
  };
}
