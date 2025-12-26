/**
 * Simple Logger utility for the Android app
 *
 * Provides centralized logging with DEV_LOG check built-in.
 * In production builds, all log/debug/info calls are no-ops.
 * Error logging always works regardless of DEV_LOG.
 *
 * @example
 * ```ts
 * import { logger } from "~/utils";
 *
 * logger.log("Simple message");
 * logger.debug("ThemeService", "initialized");
 * logger.info("AppVariables", "Font scale:", 1.5);
 * logger.warn("FAB", "Icon not found:", iconName);
 * logger.error("FileService", "Failed to save:", error);
 * ```
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  /**
   * Log a debug message (only in development)
   * @param tag - Optional tag/component name for context
   * @param args - Message and additional data
   */
  public debug(tag: string, ...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(`[${tag}]`, ...args);
    }
  }

  /**
   * Log an info message (only in development)
   * Alias for debug with different semantic meaning
   * @param tag - Optional tag/component name for context
   * @param args - Message and additional data
   */
  public info(tag: string, ...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(`[${tag}]`, ...args);
    }
  }

  /**
   * Log a simple message without tag (only in development)
   * @param args - Message and additional data
   */
  public log(...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(...args);
    }
  }

  /**
   * Log a warning message (only in development)
   * @param tag - Optional tag/component name for context
   * @param args - Message and additional data
   */
  public warn(tag: string, ...args: unknown[]): void {
    if (DEV_LOG) {
      console.warn(`[${tag}]`, ...args);
    }
  }

  /**
   * Log an error message (ALWAYS logs, even in production)
   * Errors are important and should always be visible
   * @param tag - Optional tag/component name for context
   * @param args - Message and additional data
   */
  public error(tag: string, ...args: unknown[]): void {
    // Errors always log regardless of DEV_LOG
    console.error(`[${tag}]`, ...args);
  }

  /**
   * Create a scoped logger with a fixed tag
   * Useful for classes/modules that want consistent tagging
   *
   * @example
   * ```ts
   * const log = logger.scoped("ThemeService");
   * log.debug("initialized");
   * log.error("Failed to apply theme:", error);
   * ```
   *
   * @param tag - The tag to use for all messages from this logger
   * @returns A scoped logger instance
   */
  public scoped(tag: string): ScopedLogger {
    return new ScopedLogger(tag);
  }
}

/**
 * Scoped logger with a fixed tag
 * Created via logger.scoped("TagName")
 */
class ScopedLogger {
  constructor(private readonly tag: string) {}

  public debug(...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(`[${this.tag}]`, ...args);
    }
  }

  public info(...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(`[${this.tag}]`, ...args);
    }
  }

  public log(...args: unknown[]): void {
    if (DEV_LOG) {
      console.log(`[${this.tag}]`, ...args);
    }
  }

  public warn(...args: unknown[]): void {
    if (DEV_LOG) {
      console.warn(`[${this.tag}]`, ...args);
    }
  }

  public error(...args: unknown[]): void {
    // Errors always log regardless of DEV_LOG
    console.error(`[${this.tag}]`, ...args);
  }
}

/**
 * Singleton logger instance
 * Import this in your modules for logging
 */
export const logger = new Logger();
