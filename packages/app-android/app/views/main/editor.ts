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
  private _helpPanel: StackLayout | null = null;
  private _helpToggleButton: Button | null = null;
  private _helpVisible: boolean = false;

  /**
   * Get the current code in the editor
   * Implements EditorView
   */
  get code(): string {
    return this._sourceView ? this._sourceView.code : "";
  }

  /**
   * Set code in the editor using the setCode method
   * Implements EditorView
   */
  set code(value: string) {
    this.setCode(value);
  }

  /**
   * Set code in the editor
   * Implements EditorView
   *
   * @param value Code to set
   */
  setCode(value: string): void {
    if (this.code === value) return;

    if (this._sourceView) {
      this._sourceView.code = value;
    }

    // Notify NativeScript UI bindings
    this.notifyPropertyChange("code", value);
  }

  /**
   * Check if the editor has any code
   * Implements EditorView
   */
  get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  /**
   * Add content to the editor at current position
   * Implements EditorView
   *
   * @param content Content to add
   */
  addContent(content: string): void {
    // In NativeScript, we'll just append content to the end
    this.setCode(this.code + content);
  }

  /**
   * Clear editor content
   * Implements EditorView
   */
  clear(): void {
    this.setCode("");
  }

  /**
   * Set focus to the editor
   * Implements EditorView
   *
   * @returns Whether the editor was focused
   */
  focus(): boolean {
    if (this._sourceView) {
      return this._sourceView.focus();
    }
    return false;
  }

  /**
   * Handle editor change event
   * Implements EditorView
   *
   * @param event The source view changed event
   */
  private onChanged = (event: { code: string }): void => {
    // Notify NativeScript UI bindings if the code actually changed
    this.notifyPropertyChange("code", event.code);

    // Forward the code change event to our own events
    this.events.dispatch("changed", event);
  };

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
      this._sourceView.events.on("changed", this.onChanged);

      // Set default code if SourceView doesn't have any
      if (!this._sourceView.code) {
        this._sourceView.code =
          "LDA #$01\nSTA $0200\nLDA #$05\nSTA $0201\nLDA #$08\nSTA $0202";
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
export const editorView = new Editor();

// Export the functions for XML binding
export const onNavigatingTo = editorView.onNavigatingTo.bind(editorView);
export const onHelpToggleTap = editorView.onHelpToggleTap.bind(editorView);

// Helper methods for main controller
export const getCode = (): string => editorView.code;
export const hasCode = (): boolean => editorView.hasCode;
