/**
 * Centralized error handling utility
 *
 * Pattern from reference projects (conty, oss-weather, alpimaps)
 * Provides consistent error handling across the app
 * Automatically logs errors using the logger utility
 */

import { alert } from "@nativescript/core/ui/dialogs";
import { notificationService } from "../services";
import type { ErrorHandlerOptions, ExtendedError } from "../types";
import { logger } from "./logger";

/**
 * Check if an error should be ignored
 */
function shouldIgnoreError(error: Error | ExtendedError): boolean {
  return error instanceof Error && (error as ExtendedError).customErrorConstructorName === "IgnoreError";
}

/**
 * Extract error message from Error or string
 */
function extractErrorMessage(err: Error | string): string {
  if (typeof err === "string") {
    return err;
  }
  return err.message || err.toString();
}

/**
 * Show error to user with appropriate UI
 * Automatically logs errors using the logger utility
 * Uses NativeScript dialogs for UI
 */
export async function showError(err: unknown, options: ErrorHandlerOptions = {}): Promise<void> {
  try {
    if (!err) {
      return;
    }

    const { showAsNotification = false, forcedMessage, silent = false, title } = options;

    // Convert to Error for consistent handling
    const error: Error | ExtendedError =
      err instanceof Error ? err : new Error(typeof err === "string" ? err : String(err));

    // Check for ignore flag
    if (shouldIgnoreError(error)) {
      return;
    }

    // Extract message
    const message = forcedMessage || error.message;

    // Log error using logger (automatically handles Error objects with stack traces)
    // If we have a forced message, log it separately; otherwise let logger format the error
    if (forcedMessage) {
      logger.error("ErrorHandler", forcedMessage, error);
    } else {
      logger.error("ErrorHandler", error);
    }

    // Show as notification if requested
    if (showAsNotification || (error as ExtendedError).showAsSnack) {
      notificationService.showNotification({
        title: message,
        timeout: 3,
      });
      return;
    }

    // Silent mode - just log, don't show UI
    if (silent) {
      return;
    }

    // Show error dialog
    await alert({
      title: title || "Error",
      message: message.trim(),
      okButtonText: "OK",
    });
  } catch (error) {
    // Fallback if error handling itself fails
    logger.error("ErrorHandler", "Error in showError:", error);
  }
}

/**
 * Setup global error handler
 * Replaces global.__errorHandler with better implementation
 */
export function setupGlobalErrorHandler(): void {
  (globalThis as any).__errorHandler = function (error: Error | null | undefined, nativeError?: unknown): boolean {
    // Log error using logger (automatically handles Error objects)
    if (error) {
      logger.error("GlobalErrorHandler", "Global error caught:", error);
    }

    if (nativeError) {
      logger.error("GlobalErrorHandler", "Native error:", nativeError);
    }

    // Show error to user (non-blocking)
    // showError handles all errors internally, so no catch needed
    if (error) {
      showError(error, {
        showAsNotification: true,
        silent: false,
      });
    }

    // Return true to prevent default error handling
    return true;
  };
}
