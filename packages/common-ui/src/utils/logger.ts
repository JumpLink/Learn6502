/**
 * Platform-independent logger interface and default implementation.
 *
 * Provides centralized logging with scoped tagging.
 * Platforms can provide their own implementation (e.g., with DEV_LOG checks).
 */

/**
 * Check if a value is an Error instance
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Stringify an unknown value for logging output.
 */
function stringify(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (isError(value)) {
    const stack = value.stack ? `\nStack trace:\n${value.stack}` : "";
    return `Error: ${value.message || value.toString()}${stack}`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Join arguments into a single log string, formatting errors specially.
 */
function formatArgs(prefix: string, args: unknown[]): string {
  const parts: string[] = [prefix];
  for (const arg of args) {
    parts.push(stringify(arg));
  }
  return parts.join(" ");
}

export interface ScopedLoggerInterface {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface LoggerInterface {
  debug(tag: string, ...args: unknown[]): void;
  info(tag: string, ...args: unknown[]): void;
  log(...args: unknown[]): void;
  warn(tag: string, ...args: unknown[]): void;
  error(tag: string, ...args: unknown[]): void;
  scoped(tag: string): ScopedLoggerInterface;
}

/**
 * Scoped logger with a fixed tag.
 * Created via logger.scoped("TagName").
 */
class ScopedLogger implements ScopedLoggerInterface {
  constructor(
    private readonly tag: string,
    private readonly isDevMode: () => boolean
  ) {}

  public debug(...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(formatArgs(`[${this.tag}]`, args));
    }
  }

  public info(...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(formatArgs(`[${this.tag}]`, args));
    }
  }

  public log(...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(formatArgs(`[${this.tag}]`, args));
    }
  }

  public warn(...args: unknown[]): void {
    if (this.isDevMode()) {
      console.warn(formatArgs(`[${this.tag}]`, args));
    }
  }

  public error(...args: unknown[]): void {
    console.error(formatArgs(`[${this.tag}]`, args));
  }
}

/**
 * Default Logger implementation.
 * Uses a configurable `isDevMode` check to gate debug/info/warn output.
 * Error logging always works regardless of mode.
 */
export class Logger implements LoggerInterface {
  private readonly isDevMode: () => boolean;

  /**
   * @param isDevMode Function that returns true when debug logging should be enabled.
   *                   Defaults to always true (all logs visible).
   */
  constructor(isDevMode: () => boolean = () => true) {
    this.isDevMode = isDevMode;
  }

  public debug(tag: string, ...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(formatArgs(`[${tag}]`, args));
    }
  }

  public info(tag: string, ...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(formatArgs(`[${tag}]`, args));
    }
  }

  public log(...args: unknown[]): void {
    if (this.isDevMode()) {
      console.log(args.map(stringify).join(" "));
    }
  }

  public warn(tag: string, ...args: unknown[]): void {
    if (this.isDevMode()) {
      console.warn(formatArgs(`[${tag}]`, args));
    }
  }

  public error(tag: string, ...args: unknown[]): void {
    console.error(formatArgs(`[${tag}]`, args));
  }

  public scoped(tag: string): ScopedLoggerInterface {
    return new ScopedLogger(tag, this.isDevMode);
  }
}
