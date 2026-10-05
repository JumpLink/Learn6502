import { EventDispatcher } from "@learn6502/core";
import type { SourceViewWidget } from "../widgets/source-view";
import type { EditorEventMap } from "../types/editor-event-map";

/**
 * Platform-independent editor controller
 * Acts as a state manager and event hub for editor functionality
 * Works directly with SourceViewWidget implementations
 */
class EditorController {
  readonly events = new EventDispatcher<EditorEventMap>();

  // State preservation
  private _isInitialized: boolean = false;
  private _persistedCode: string = "";
  private _persistedHelpVisible: boolean = false;

  // Platform-specific SourceView reference
  private _sourceView: SourceViewWidget | null = null;

  /**
   * Initialize the controller with a platform-specific SourceView
   * @param sourceView Platform-specific SourceView widget
   */
  public init(sourceView: SourceViewWidget): void {
    this._sourceView = sourceView;

    // Set up event forwarding from SourceView to controller
    this._sourceView.events.on("changed", (event) => {
      // Update persisted code when user types
      this._persistedCode = event.code;

      // Forward the event to other listeners (like main controller)
      this.events.dispatch("changed", event);
    });

    // Restore state if already initialized
    if (this._isInitialized) {
      console.log("[EditorController] Restoring state to SourceView");
      this.restoreState();
    } else {
      console.log("[EditorController] First initialization");
      this._sourceView.code = this._persistedCode;
      this._isInitialized = true;
    }
  }

  /**
   * Get the current code in the editor
   */
  get code(): string {
    // Return from SourceView if available, otherwise from persisted state
    return this._sourceView ? this._sourceView.code : this._persistedCode;
  }

  /**
   * Set code in the editor
   * @param value Code to set
   */
  setCode(value: string): void {
    if (this.code === value) return;

    // Update persisted code
    this._persistedCode = value;

    // Update SourceView if available
    if (this._sourceView) {
      this._sourceView.code = value;
    }
  }

  /**
   * Check if the editor has any code
   */
  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  /**
   * Add content to the editor
   * @param content Content to add
   */
  addContent(content: string): void {
    this.setCode(this.code + content);
  }

  /**
   * Clear editor content
   */
  clear(): void {
    this.setCode("");
  }

  /**
   * Get help panel visibility state
   */
  get helpVisible(): boolean {
    return this._persistedHelpVisible;
  }

  /**
   * Set help panel visibility state
   * @param visible Whether help panel should be visible
   */
  setHelpVisible(visible: boolean): void {
    if (this._persistedHelpVisible === visible) return;

    this._persistedHelpVisible = visible;

    // Dispatch event to notify platform widgets
    this.events.dispatch("helpVisibilityChanged", { visible });
  }

  /**
   * Restore the state to the SourceView
   */
  private restoreState(): void {
    if (this._sourceView && this._persistedCode) {
      this._sourceView.code = this._persistedCode;
    }
  }

  /**
   * Save current state from SourceView
   */
  public saveState(): void {
    if (this._sourceView) {
      this._persistedCode = this._sourceView.code;
    }
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    this._persistedCode = "";
    this._persistedHelpVisible = false;
  }
}

// Create singleton instance
export const editorController = new EditorController();
