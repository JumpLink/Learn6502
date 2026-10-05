import type { LoggerInterface } from "./logger";

export interface ErrorHandlerOptions {
  showAsNotification?: boolean;
  forcedMessage?: string;
  silent?: boolean;
  title?: string;
}

export interface ExtendedError extends Error {
  customErrorConstructorName?: string;
  showAsSnack?: boolean;
}

/**
 * Platform-independent error handling callbacks.
 * Platforms provide their own UI implementations (dialogs, notifications).
 */
export interface ErrorHandlerCallbacks {
  showNotification(message: string): void;
  showDialog(title: string, message: string): Promise<void>;
}

/**
 * Shared error handling logic.
 * Provides consistent error processing across platforms while
 * delegating UI presentation to platform-specific callbacks.
 */
export class ErrorHandler {
  constructor(
    private readonly logger: LoggerInterface,
    private readonly callbacks: ErrorHandlerCallbacks
  ) {}

  async showError(err: Error | string | null | undefined, options: ErrorHandlerOptions = {}): Promise<void> {
    try {
      if (!err) return;

      const { showAsNotification = false, forcedMessage, silent = false, title } = options;

      const error: Error | ExtendedError = typeof err === "string" ? new Error(err) : err;

      if (this.shouldIgnoreError(error)) return;

      const message = forcedMessage || this.extractErrorMessage(err);

      if (forcedMessage) {
        this.logger.error("ErrorHandler", forcedMessage, error);
      } else {
        this.logger.error("ErrorHandler", error);
      }

      if (showAsNotification || (error as ExtendedError).showAsSnack) {
        this.callbacks.showNotification(message);
        return;
      }

      if (silent) return;

      await this.callbacks.showDialog(title || "Error", message.trim());
    } catch (error) {
      this.logger.error("ErrorHandler", "Error in showError:", error);
    }
  }

  private shouldIgnoreError(error: Error | ExtendedError): boolean {
    return error instanceof Error && (error as ExtendedError).customErrorConstructorName === "IgnoreError";
  }

  private extractErrorMessage(err: Error | string): string {
    if (typeof err === "string") return err;
    return err.message || err.toString();
  }
}
