import type { Memory } from "@learn6502/core";

/** What the main window needs from the platform to open and save the user's program. */
export interface FileChooser {
  openFile(): Promise<{ content: string; filename: string } | null>;
  saveFile(content: string): Promise<boolean>;
  saveFileAs(content: string, suggestedName?: string): Promise<boolean>;
  getCurrentFileName(): string;
  /** A file is attached to the editor, so "save" has a target and needs no dialog. */
  hasCurrentFile(): boolean;
  setUnsavedChanges(hasChanges: boolean): void;
}

/** The persisted window geometry; GNOME backs it with GSettings. */
export interface WindowSettings {
  getInt(key: string): number;
  setInt(key: string, value: number): void;
  getBoolean(key: string): boolean;
  setBoolean(key: string, value: boolean): void;
}

export interface Clipboard {
  /** Returns false when the platform has no clipboard to write to. */
  copy(text: string): boolean;
}

export interface Notifier {
  show(options: { title: string; timeout?: number }): void;
}

/** Everything the main window asks of its platform; each app injects its own. */
export interface MainWindowServices {
  files: FileChooser;
  settings: WindowSettings;
  clipboard: Clipboard;
  notifier: Notifier;
  /** Open the help window. */
  showHelp(): void;
  /** Open the dialog that submits the program as a new example. */
  showShareDialog(code: string, memory: Memory): void;
}
