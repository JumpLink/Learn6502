export interface MessageConsoleWidget {
  log(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  clear(): void;
  prompt(message: string, defaultValue?: string): string | null;
}
