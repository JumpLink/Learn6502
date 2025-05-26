import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GtkSource from "@girs/gtksource-5";
import { SourceView } from "../../widgets/source-view.ts";
import { QuickHelpView } from "../../mdx/quick-help-view.ts";
import { EventDispatcher } from "@learn6502/6502";
import type { EditorView, EditorEventMap } from "@learn6502/common-ui";
import { editorController } from "@learn6502/common-ui";

import Template from "./editor.blp";

/**
 * @class Editor to edit 6502 assembly code
 * Implements EditorView from common-ui
 *
 * @emits changed - Emitted when the buffer's text changes
 */
export class Editor extends Adw.Bin implements EditorView {
  readonly events = new EventDispatcher<EditorEventMap>();

  // Child widgets

  /** The SourceView that displays the buffer's display */
  declare private _sourceView: SourceView;

  /** The QuickHelp that displays the quick help */
  declare private _quickHelpView: QuickHelpView;

  /** The ScrolledWindow that contains the quick help */
  declare private _scrolledWindow: Gtk.ScrolledWindow;

  // State preservation - now handled by editorController
  private _isInitialized: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "Editor",
        Template,
        InternalChildren: ["sourceView", "quickHelpView", "scrolledWindow"],
        Properties: {
          code: GObject.ParamSpec.string(
            "code",
            "Code",
            "The source code of the editor",
            GObject.ParamFlags.READWRITE,
            ""
          ),
        },
      },
      this
    );
  }

  /**
   * Set the source code
   * Implements EditorView
   */
  public set code(value: string) {
    this.setCode(value);
  }

  /**
   * Set the source code
   * Implements EditorView
   *
   * @param value The source code to set
   */
  public setCode(value: string): void {
    editorController.setCode(value);
    this.notify("code");
  }

  /**
   * Get the source code
   * Implements EditorView
   */
  public get code(): string {
    return editorController.code;
  }

  /**
   * Get the buffer of the source view
   * @returns The buffer of the source view
   */
  public get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer;
  }

  /**
   * Get whether the editor has code
   * Implements EditorView
   *
   * @returns Whether the editor has code
   */
  public get hasCode(): boolean {
    return editorController.hasCode;
  }

  /**
   * Add content to the editor at current position
   * Implements EditorView
   *
   * @param content Content to add
   */
  public addContent(content: string): void {
    editorController.addContent(content);
  }

  /**
   * Clear editor content
   * Implements EditorView
   */
  public clear(): void {
    editorController.clear();
  }

  /**
   * Set focus to the editor
   * Implements EditorView
   *
   * @returns Whether the editor was focused
   */
  public focus(): boolean {
    return this._sourceView.grab_focus();
  }

  /**
   * Handle controller code changes (from external sources)
   * @param event The controller changed event
   */
  private onControllerCodeChanged = (event: { code: string }): void => {
    // Update the GObject property to trigger UI updates
    this.notify("code");

    // Forward the code change event to our own events
    this.events.dispatch("changed", event);
  };

  /**
   * Initialize the editor with the controller
   */
  private initializeWithController(): void {
    if (!this._isInitialized) {
      console.log("[Editor] First initialization with controller");
      editorController.init(this._sourceView);

      // Subscribe to controller events
      editorController.events.on("changed", this.onControllerCodeChanged);

      this._isInitialized = true;
    }

    // Always restore state from controller
    this.restoreState();
  }

  /**
   * Restore state from controller
   */
  private restoreState(): void {
    // Notify about current code to update UI bindings
    this.notify("code");
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    // Initialize with controller after construction
    this.initializeWithController();
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    editorController.resetInitialization();
  }

  /**
   * Save current state to controller (called before navigation/close)
   */
  saveState(): void {
    editorController.saveState();
  }
}

GObject.type_ensure(Editor.$gtype);
