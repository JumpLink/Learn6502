import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GtkSource from "@girs/gtksource-5";
import { SourceView } from "../../widgets/source-view.ts";
import { QuickHelpView } from "../../mdx/quick-help-view.ts";
import { EventDispatcher } from "@learn6502/6502";
import type {
  EditorView,
  EditorEventMap,
  SourceViewChangedEvent,
} from "@learn6502/common-ui";

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
    if (this.code === value) return;
    this._sourceView.code = value;
    this.notify("code");
  }

  /**
   * Get the source code
   * Implements EditorView
   */
  public get code(): string {
    return this._sourceView.code;
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
    const hasCode = this.code.trim().length > 0;
    return hasCode;
  }

  /**
   * Add content to the editor at current position
   * Implements EditorView
   *
   * @param content Content to add
   */
  public addContent(content: string): void {
    // Get cursor position
    const cursor = this.buffer.get_insert();
    const iter = this.buffer.get_iter_at_mark(cursor);

    // Insert text at cursor position
    this.buffer.insert(iter, content, -1);
  }

  /**
   * Clear editor content
   * Implements EditorView
   */
  public clear(): void {
    this.buffer.set_text("", -1);
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
   * Handle editor change event
   * Implements EditorView
   *
   * @param handler Handler function
   */
  protected onChanged(event: SourceViewChangedEvent): void {
    // Forward the code change event to our own events
    this.events.dispatch("changed", event);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    this.onChanged = this.onChanged.bind(this);

    // Subscribe to the SourceView's events
    this._sourceView.events.on("changed", this.onChanged);
  }
}

GObject.type_ensure(Editor.$gtype);
