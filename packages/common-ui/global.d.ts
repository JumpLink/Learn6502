// We don't want to use the DOM types in the common-ui package to make it cross-platform,
// but we need the console types.

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
