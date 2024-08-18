// We don't want to use the DOM types in the 6502 package to make it cross-platform,
// but we need the interval and timeout functions
declare function setInterval(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearInterval(handle?: number): void;

declare function setTimeout(handler: TimerHandler, timeout?: number, ...arguments: any[]): number;
declare function clearTimeout(handle?: number): void;

type TimerHandler = string | Function;

// Console types
type ConsoleLog = (message: string) => void;
type ConsoleWarn = (message: string) => void;
type ConsoleError = (message: string) => void;
type ConsoleClear = () => void;
type ConsolePrompt = (message: string, defaultValue?: string) => string | null;

declare interface Console {
  log: ConsoleLog;
  warn: ConsoleWarn;
  error: ConsoleError;
  clear: ConsoleClear;
  prompt: ConsolePrompt;
}

declare const console: Console;