import {
  Observable,
  Page,
  EventData,
  Button,
  StackLayout,
} from "@nativescript/core";
import {
  EditorView,
  EditorEventMap,
  editorController,
} from "@learn6502/common-ui";
import { SourceView } from "~/widgets/source-view";
import { EventDispatcher } from "@learn6502/6502";
import { logger } from "~/utils";

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

  // State preservation - now handled by editorController
  private _isInitialized: boolean = false;

  // Scoped logger for this class
  private log = logger.scoped("Editor");

  /**
   * Get the current code in the editor
   * Implements EditorView
   */
  get code(): string {
    return editorController.code;
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
    editorController.setCode(value);
    // Notify NativeScript UI bindings
    this.notifyPropertyChange("code", value);
  }

  /**
   * Check if the editor has any code
   * Implements EditorView
   */
  get hasCode(): boolean {
    return editorController.hasCode;
  }

  /**
   * Add content to the editor at current position
   * Implements EditorView
   *
   * @param content Content to add
   */
  addContent(content: string): void {
    editorController.addContent(content);
  }

  /**
   * Clear editor content
   * Implements EditorView
   */
  clear(): void {
    editorController.clear();
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
   * Handle controller code changes (from external sources)
   * @param event The controller changed event
   */
  private onControllerCodeChanged = (event: { code: string }): void => {
    // Update NativeScript UI bindings when code changes externally
    this.notifyPropertyChange("code", event.code);

    // Forward the code change event to our own events
    this.events.dispatch("changed", event);
  };

  /**
   * Handle controller help visibility changes
   * @param event The help visibility changed event
   */
  private onControllerHelpVisibilityChanged = (event: {
    visible: boolean;
  }): void => {
    this._helpVisible = event.visible;
    this.updateHelpPanelUI();
  };

  /**
   * Update help panel UI based on current state
   */
  private updateHelpPanelUI(): void {
    if (this._helpPanel && this._helpToggleButton) {
      this._helpPanel.visibility = this._helpVisible ? "visible" : "collapsed";
      this._helpToggleButton.text = this._helpVisible
        ? "Hide Help"
        : "Show Help";
    }
  }

  /**
   * Restore the UI state from controller
   */
  private restoreState(): void {
    this._helpVisible = editorController.helpVisible;
    this.updateHelpPanelUI();

    // Notify about current code
    this.notifyPropertyChange("code", editorController.code);
  }

  /**
   * Initialize the editor model when navigating to the page
   */
  onNavigatingTo(args: EventData): void {
    const page = args.object as Page;
    page.bindingContext = this;

    this.log.debug(`onNavigatingTo - isInitialized: ${this._isInitialized}`);

    this._sourceView = page.getViewById<SourceView>("sourceView");
    this._helpPanel = page.getViewById<StackLayout>("helpPanel");
    this._helpToggleButton = page.getViewById<Button>("helpToggleButton");

    if (this._sourceView) {
      // Initialize controller with SourceView
      if (!this._isInitialized) {
        this.log.debug("First initialization with controller");
        editorController.init(this._sourceView);

        // Subscribe to controller events
        editorController.events.on("changed", this.onControllerCodeChanged);
        editorController.events.on(
          "helpVisibilityChanged",
          this.onControllerHelpVisibilityChanged
        );

        this._isInitialized = true;
      }

      // Always restore state when navigating to the view
      this.restoreState();
    } else {
      this.log.error(
        "SourceView (sourceView) not found on page. Editor will not function correctly."
      );
    }
  }

  /**
   * Clean up when navigating away
   */
  onNavigatingFrom(): void {
    // Save current state to controller before navigation
    editorController.saveState();

    this.log.debug("State saved to controller before navigation");
  }

  /**
   * Toggle the visibility of the help panel
   */
  onHelpToggleTap(): void {
    if (!this._helpPanel || !this._helpToggleButton) return;

    // Update through controller to keep state synchronized
    editorController.setHelpVisible(!this._helpVisible);
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    editorController.resetInitialization();
  }
}

// Create singleton instance
export const editorView = new Editor();

// Export the functions for XML binding
export const onNavigatingTo = editorView.onNavigatingTo.bind(editorView);
export const onNavigatingFrom = editorView.onNavigatingFrom.bind(editorView);
export const onHelpToggleTap = editorView.onHelpToggleTap.bind(editorView);
