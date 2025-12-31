/**
 * Types and interfaces for error handling
 */

export interface ErrorHandlerOptions {
  /**
   * Show error as snack/notification instead of dialog
   */
  showAsNotification?: boolean;
  /**
   * Forced error message (overrides error message)
   */
  forcedMessage?: string;
  /**
   * Silent mode - don't show any UI, just log
   */
  silent?: boolean;
  /**
   * Title for error dialog
   */
  title?: string;
}

/**
 * Extended Error interface for custom error properties
 */
export interface ExtendedError extends Error {
  customErrorConstructorName?: string;
  showAsSnack?: boolean;
}
