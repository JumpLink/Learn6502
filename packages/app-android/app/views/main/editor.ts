import {
  Observable,
  Page,
  EventData,
  Button,
  StackLayout,
} from "@nativescript/core";
import { EditorView, EditorEventMap } from "@learn6502/common-ui";
import { SourceView } from "~/widgets/source-view";
import { EventDispatcher } from "@learn6502/6502";

/**
 * Editor class for handling editor data and operations
 * Implements the EditorView from common-ui
 */
class Editor extends Observable implements EditorView {
  readonly events: EventDispatcher<EditorEventMap> =
    new EventDispatcher<EditorEventMap>();

  private _sourceView: SourceView | null = null;
  private _code: string = "";
  private _helpPanel: StackLayout | null = null;
  private _helpToggleButton: Button | null = null;
  private _helpVisible: boolean = false;

  /**
   * Get the current code in the editor
   */
  get code(): string {
    // If sourceView is available, get code directly from it
    return this._sourceView ? this._sourceView.code : this._code;
  }

  /**
   * Set code in the editor using the setCode method
   */
  set code(value: string) {
    this.setCode(value);
  }

  /**
   * Set code in the editor
   * @param value Code to set
   */
  setCode(value: string): void {
    const oldModelCode = this._code;
    this._code = value; // Always update internal cache

    if (this._sourceView) {
      this._sourceView.code = value;
    }

    // Notify if code actually changed for NativeScript bindings
    if (oldModelCode !== value) {
      this.notifyPropertyChange("code", value);
    }
  }

  /**
   * Add content to the editor at current position
   * @param content Content to add
   */
  addContent(content: string): void {
    // In NativeScript, we'll just append content to the end
    this.setCode(this.code + content);
  }

  /**
   * Clear editor content
   */
  clear(): void {
    this.setCode("");
  }

  /**
   * Set focus to the editor
   */
  focus(): boolean {
    if (this._sourceView) {
      return this._sourceView.focus();
    }
    return false;
  }

  /**
   * Check if the editor has any code
   */
  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  /**
   * Initialize the editor model when navigating to the page
   */
  onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    page.bindingContext = this;

    this._sourceView = page.getViewById<SourceView>("sourceView");
    this._helpPanel = page.getViewById<StackLayout>("helpPanel");
    this._helpToggleButton = page.getViewById<Button>("helpToggleButton");

    if (this._sourceView) {
      // Subscribe to SourceView's 'changed' event
      this._sourceView.events.on("changed", (event) => {
        const newCodeFromSourceView = event.code;
        const oldModelCode = this._code;
        this._code = newCodeFromSourceView; // Sync internal model code

        // Notify NativeScript UI bindings if the code actually changed from the model's perspective
        if (oldModelCode !== newCodeFromSourceView) {
          this.notifyPropertyChange("code", newCodeFromSourceView);
        }

        // Dispatch EditorView's changed event
        this.events.dispatch("changed", { code: newCodeFromSourceView });
      });

      // If no code is set yet, set default code
      // Otherwise, ensure SourceView has the current model code
      if (!this.hasCode) {
        const defaultCode =
          "LDA #$01\nSTA $0200\nLDA #$05\nSTA $0201\nLDA #$08\nSTA $0202";
        this.setCode(defaultCode);
      } else if (this._sourceView.code !== this._code) {
        this._sourceView.code = this._code;
      }
    } else {
      console.error(
        "[Editor] SourceView (sourceView) not found on page. Editor will not function correctly."
      );
    }
  }

  /**
   * Toggle the visibility of the help panel
   */
  onHelpToggleTap(): void {
    if (!this._helpPanel || !this._helpToggleButton) return;

    this._helpVisible = !this._helpVisible;
    this._helpPanel.visibility = this._helpVisible ? "visible" : "collapsed";
    this._helpToggleButton.text = this._helpVisible ? "Hide Help" : "Show Help";
  }
}

// Create singleton instance
const editorModel = new Editor();

// Export the functions for XML binding
export const onNavigatingTo = editorModel.onNavigatingTo.bind(editorModel);
export const onHelpToggleTap = editorModel.onHelpToggleTap.bind(editorModel);
