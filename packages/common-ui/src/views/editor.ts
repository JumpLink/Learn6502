import type { EventDispatcher } from "@learn6502/6502";
import type { EditorEventMap } from "../types/editor-event-map";

/**
 * Interface for editor views across platforms
 */
export interface EditorView {
  readonly events: EventDispatcher<EditorEventMap>;
  /**
   * Get the current code in the editor
   */
  readonly code: string;

  /**
   * Set code in the editor
   * @param value Code to set
   */
  setCode(value: string): void;

  /**
   * Check if editor has code
   */
  readonly hasCode: boolean;

  /**
   * Add content to the editor at current position
   * @param content Content to add
   */
  addContent(content: string): void;

  /**
   * Clear editor content
   */
  clear(): void;

  /**
   * Set focus to the editor
   * @returns Whether focus was successfully set
   */
  focus(): boolean;
}
