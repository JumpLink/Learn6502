import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type GtkSource from "@girs/gtksource-5";
import type { SourceView } from "../source-view.ts";
import { EventDispatcher } from "@learn6502/core";
import type { EditorView } from "../views/index.ts";
import type { EditorEventMap, EditorHelpVisibilityChangedEvent } from "../types/index.ts";
import { editorController } from "../controller/index.ts";

import Template from "./editor.blp?template";

/**
 * @class Editor to edit 6502 assembly code
 * Implements EditorView
 *
 * The template names `$QuickHelpView`, whose content is generated per platform from the same MDX:
 * the app registers a class of that name before it builds an Editor.
 *
 * @emits changed - Emitted when the buffer's text changes
 */
export class Editor extends Adw.Bin implements EditorView {
  readonly events = new EventDispatcher<EditorEventMap>();

  // Child widgets

  /** The SourceView that displays the buffer's display */
  declare private _sourceView: SourceView;

  /** The sheet that slides the quick help up over the source view */
  declare private _bottomSheet: Adw.BottomSheet;

  // State preservation - now handled by editorController
  private _isInitialized: boolean = false;

  static {
    GObject.registerClass(
      {
        GTypeName: "Editor",
        Template,
        InternalChildren: ["sourceView", "bottomSheet"],
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

  /** The sheet that holds the quick help; a platform may pad it, e.g. for system insets. */
  public get bottomSheet(): Adw.BottomSheet {
    return this._bottomSheet;
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

  /** Mirror the controller's help state onto the sheet (it is opened from the main menu too) */
  private onHelpVisibilityChanged = (event: EditorHelpVisibilityChangedEvent): void => {
    if (this._bottomSheet.open !== event.visible) this._bottomSheet.open = event.visible;
  };

  /** Mirror a user dismissal or the Help bar back onto the controller */
  private onSheetOpenChanged(): void {
    editorController.setHelpVisible(this._bottomSheet.open);
  }

  /**
   * Initialize the editor with the controller
   */
  private initializeWithController(): void {
    if (!this._isInitialized) {
      console.log("[Editor] First initialization with controller");
      editorController.init(this._sourceView);

      // Subscribe to controller events
      editorController.events.on("changed", this.onControllerCodeChanged);
      editorController.events.on("helpVisibilityChanged", this.onHelpVisibilityChanged);
      this._bottomSheet.connect("notify::open", this.onSheetOpenChanged.bind(this));

      this._isInitialized = true;
    }

    // Always restore state from controller
    this.restoreState();
    this._bottomSheet.open = editorController.helpVisible;
  }

  /**
   * Restore state from controller
   */
  private restoreState(): void {
    // Notify about current code to update UI bindings
    this.notify("code");
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
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
   * Stop listening to the controller, which outlives this widget. A platform that builds a fresh
   * Editor (Android on activity recreation) unbinds the old one, or it keeps steering a dead sheet.
   */
  unbind(): void {
    editorController.events.off("changed", this.onControllerCodeChanged);
    editorController.events.off("helpVisibilityChanged", this.onHelpVisibilityChanged);
  }

  /**
   * Save current state to controller (called before navigation/close)
   */
  saveState(): void {
    editorController.saveState();
  }
}

GObject.type_ensure(Editor.$gtype);
