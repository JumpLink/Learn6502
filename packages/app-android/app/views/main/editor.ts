import {
  Observable,
  Page,
  EventData,
  Button,
  StackLayout,
} from "@nativescript/core";
import { EditorView } from "@learn6502/common-ui";
import { SourceView } from "~/widgets/source-view";

/**
 * EditorModel class for handling editor data and operations
 * Implements the EditorView from common-ui
 */
class EditorModel extends Observable implements EditorView {
  private _sourceView: SourceView | null = null;
  private _code: string = "";
  private _helpPanel: StackLayout | null = null;
  private _helpToggleButton: Button | null = null;
  private _helpVisible: boolean = false;
  private _changeHandler: (() => void) | null = null;

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
    this._code = value;
    if (this._sourceView) {
      this._sourceView.code = value;
    }
    this.notifyPropertyChange("code", value);

    // Notify any registered change handlers
    if (this._changeHandler) {
      this._changeHandler();
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
   * Handle editor change event
   * @param handler Handler function
   */
  onChanged(handler: () => void): void {
    this._changeHandler = handler;
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

    // Get references to UI elements
    this._sourceView = page.getViewById<SourceView>("sourceView");
    this._helpPanel = page.getViewById<StackLayout>("helpPanel");
    this._helpToggleButton = page.getViewById<Button>("helpToggleButton");

    // Initialize with some sample code if none exists
    if (!this.hasCode) {
      this.setCode(
        "; Example 6502, assembly code\n\nLDA #$01\nSTA $0200\nLDX #$00\nLDY #$00"
      );
    }

    // Update the source view with current code
    if (this._sourceView) {
      this._sourceView.code = this._code;
    }

    // Set the page bindingContext to this model
    page.bindingContext = this;
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
const editorModel = new EditorModel();

// Export the functions for XML binding
export const onNavigatingTo = editorModel.onNavigatingTo.bind(editorModel);
export const onHelpToggleTap = editorModel.onHelpToggleTap.bind(editorModel);
