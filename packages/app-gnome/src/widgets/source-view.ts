import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'
import Gdk from '@girs/gdk-4.0'
import GLib from '@girs/glib-2.0'

import Template from './source-view.blp'

import { GutterRendererLineNumbers } from '../gutter-renderer-line-numbers.ts'
import { GutterRendererMode } from '../types/index.ts'

GtkSource.init()

export namespace SourceView {
  export interface ConstructorProps extends Partial<Adw.Bin.ConstructorProps> {
    /** The source code of the source view */
    code?: string
    /** The language of the source view */
    language?: string
    /** The starting line number */
    lineNumberStart?: number
    /** Whether to show line numbers */
    lineNumbers?: boolean
    /** Whether to show no line numbers */
    noLineNumbers?: boolean
    /** Whether to fit the content height */
    fitContentHeight?: boolean
    /** Whether to fit the content width */
    fitContentWidth?: boolean
    /** The height of the source view */
    height?: number
    /** Whether to expand the source view horizontally */
    hexpand?: boolean
    /** Whether to expand the source view vertically */
    vexpand?: boolean
    /** Whether to make the source view readonly */
    readonly?: boolean
    /** Whether to make the source view editable */
    editable?: boolean
    /** Whether to make the source view selectable */
    selectable?: boolean
    /** Whether to make the source view unselectable */
    unselectable?: boolean
  }
}

/**
 * @class SourceView to show 6502 assembly code
 *
 * @emits changed - Emitted when the buffer's text changes
 */
export class SourceView extends Adw.Bin {

  // Child widgets
  /** The ScrolledWindow that contains the SourceView */
  declare private _scrolledWindow: Gtk.ScrolledWindow
  /** The SourceView that displays the buffer's display */
  declare private _sourceView: GtkSource.View

  static {
    GObject.registerClass({
      GTypeName: 'SourceView',
      Template,
      InternalChildren: ['sourceView', 'scrolledWindow'],
      Signals: {
        'changed': {
          param_types: [],
        },
      },
      Properties: {
        code: GObject.ParamSpec.string('code', 'Code', 'The source code of the source view', GObject.ParamFlags.READWRITE, ''),
        language: GObject.ParamSpec.string('language', 'Language', 'The language of the source view', GObject.ParamFlags.READWRITE, ''),
        readonly: GObject.ParamSpec.boolean('readonly', 'Readonly', 'Whether the source view is readonly', GObject.ParamFlags.READWRITE, false),
        editable: GObject.ParamSpec.boolean('editable', 'Editable', 'Whether the source view is editable', GObject.ParamFlags.READWRITE, true),
        selectable: GObject.ParamSpec.boolean('selectable', 'Focusable', 'Whether the source view is selectable', GObject.ParamFlags.READWRITE, true),
        unselectable: GObject.ParamSpec.boolean('unselectable', 'Unselectable', 'Whether the source view is unselectable', GObject.ParamFlags.READWRITE, false),
        lineNumbers: GObject.ParamSpec.boolean('line-numbers', 'Line Numbers', 'Whether the source view has line numbers', GObject.ParamFlags.READWRITE, true),
        noLineNumbers: GObject.ParamSpec.boolean('no-line-numbers', 'No Line Numbers', 'Whether the source view has no line numbers', GObject.ParamFlags.READWRITE, false),
        lineNumberStart: GObject.ParamSpec.uint('line-number-start', 'Line Number Start', 'The starting value for line numbers', GObject.ParamFlags.READWRITE, 0, GLib.MAXUINT32, 1),
        hexpand: GObject.ParamSpec.boolean('hexpand', 'Hexpand', 'Whether the source view is hexpand', GObject.ParamFlags.READWRITE, true),
        vexpand: GObject.ParamSpec.boolean('vexpand', 'Vexpand', 'Whether the source view is vexpand', GObject.ParamFlags.READWRITE, true),
        fitContentHeight: GObject.ParamSpec.boolean('fit-content-height', 'Fit Content Height', 'Whether the source view should fit the content height', GObject.ParamFlags.READWRITE, false),
        fitContentWidth: GObject.ParamSpec.boolean('fit-content-width', 'Fit Content Width', 'Whether the source view should fit the content width', GObject.ParamFlags.READWRITE, false),
        height: GObject.ParamSpec.uint('height', 'Height', 'The height of the source view', GObject.ParamFlags.READWRITE, 0, GLib.MAXUINT32, 0),
      },
    }, this);
  }

  /** The source code of the source view */
  public set code(value: string) {
    if(value === this.code) {
      return;
    }
    this.buffer.text = value;
    this.emitChanged();
  }

  /** The source code of the source view */
  public get code(): string {
    return this.buffer.text;
  }

  /** The buffer of the source view */
  public get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer as GtkSource.Buffer;
  }

  /**
   * Set the readonly property of the source view
   *
   * @param value - Whether the source view is readonly
   */
  public set readonly(value: boolean) {
    this.editable = !value;
  }

  /**
   * Get the readonly property of the source view
   *
   * @returns Whether the source view is readonly
   */
  public get readonly(): boolean {
    return !this.editable;
  }

  /**
   * Set the editable property of the source view
   *
   * @param value - Whether the source view is editable
   */
  public set editable(value: boolean) {
    this._sourceView.set_editable(value);
  }

  /**
   * Get the editable property of the source view
   *
   * @returns Whether the source view is editable
   */
  public get editable(): boolean {
    return this._sourceView.editable;
  }

  /**
   * Set the language of the source view
   *
   * @param language - The language of the source view, e.g. '6502-assembler'
   */
  public set language(language: string) {
    if(language === '') {
      this.buffer.set_language(null);
      return;
    }
    const languageManager = GtkSource.LanguageManager.get_default();
    const assemblyLanguage = languageManager.get_language(language);
    if (!assemblyLanguage) {
      throw new Error(`Language "${language}" not found`)
    }
    this.buffer.set_language(assemblyLanguage);

    // Update line number renderer mode based on language
    if (language === 'hex') {
      // Switch to hex mode if line numbers are enabled
      if (this.lineNumbers) {
        this.setupLineNumbers(GutterRendererMode.HEX);
      }

      // Set up copy clipboard handling for hex mode
      this.copyClipboardSignalId = this._sourceView.connect_after('copy-clipboard', this.onCopyHexClipboard.bind(this));
    } else {
      // Switch to normal mode if line numbers are enabled
      if (this.lineNumbers) {
        this.setupLineNumbers(GutterRendererMode.NORMAL);
      }

      // Clean up hex-specific settings
      if (this.copyClipboardSignalId) {
        this._sourceView.disconnect(this.copyClipboardSignalId);
        this.copyClipboardSignalId = undefined;
      }
    }
    this._sourceView.highlight_current_line = true;
  }

  /**
   * Get the language of the source view
   *
   * @returns The language of the source view, e.g. '6502-assembler'
   */
  public get language(): string {
    return this.buffer.language?.id ?? '';
  }

  /**
   * Set the selectable property of the source view
   *
   * @param value - Whether the source view is selectable
   */
  public set selectable(value: boolean) {
    if (this._selectable === value) {
      return;
    }
    if (typeof value !== 'boolean') {
      console.warn('selectable must be a boolean, got ' + typeof value);
      return;
    }
    this._selectable = value;
    this.selectableChanged();
  }

  /**
   * Get the selectable property of the source view
   *
   * @returns Whether the source view is selectable
   */
  public get selectable(): boolean {
    return this._selectable;
  }

  /**
   * Set the unselectable property of the source view
   *
   * @param value - Whether the source view is unselectable
   */
  public set unselectable(value: boolean) {
    this.selectable = !value;
  }

  /**
   * Get the unselectable property of the source view
   *
   * @returns Whether the source view is unselectable
   */
  public get unselectable(): boolean {
    return !this.selectable;
  }

  /**
   * Set the line numbers property of the source view
   *
   * @param value - Whether the source view has line numbers
   */
  public set lineNumbers(value: boolean) {

    // Always hide GtkSourceView's built-in line numbers
    this._sourceView.show_line_numbers = false;

    if (value) {
      // Always initialize our custom renderer for line numbers
      if (!this.renderer) {
        // Initialize our custom renderer with appropriate mode
        const isHexMode = this.language === 'hex';
        this.setupLineNumbers(isHexMode ? GutterRendererMode.HEX : GutterRendererMode.NORMAL);
      }
    } else {
      // Hide line numbers by removing the renderer
      if (this.renderer) {
        this.leftGutter.remove(this.renderer);
        this.renderer = undefined;
      }
    }
  }

  /**
   * Get the line numbers property of the source view
   *
   * @returns Whether the source view has line numbers
   */
  public get lineNumbers(): boolean {
    return this.renderer !== undefined;
  }

  /**
   * Set the no line numbers property of the source view
   *
   * @param value - Whether the source view has no line numbers
   */
  public set noLineNumbers(value: boolean) {
    this.lineNumbers = !value;
  }

  /**
   * Get the no line numbers property of the source view
   *
   * @returns Whether the source view has no line numbers
   */
  public get noLineNumbers(): boolean {
    return !this.lineNumbers;
  }

  /**
   * Set the fitContentHeight property of the source view.
   * This property is used to fit the content height of the source view and to disable vertical scrolling.
   *
   * @param value - Whether the source view should fit the content height
   */
  public set fitContentHeight(value: boolean) {
    const [hPolicy] = this._scrolledWindow.get_policy();
    if (value) {
      this._scrolledWindow.set_policy(hPolicy || Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.NEVER);
    } else {
      this._scrolledWindow.set_policy(hPolicy || Gtk.PolicyType.AUTOMATIC, Gtk.PolicyType.AUTOMATIC);
    }
  }

  /**
   * Set the fitContentWidth property of the source view.
   * This property is used to fit the content width of the source view and to disable horizontal scrolling.
   *
   * @param value - Whether the source view should fit the content width
   */
  public set fitContentWidth(value: boolean) {
    const [,vPolicy] = this._scrolledWindow.get_policy();
    if (value) {
      this._scrolledWindow.set_policy(Gtk.PolicyType.NEVER, vPolicy || Gtk.PolicyType.AUTOMATIC);
    } else {
      this._scrolledWindow.set_policy(Gtk.PolicyType.AUTOMATIC, vPolicy || Gtk.PolicyType.AUTOMATIC);
    }
  }

  public set height(value: number) {
    if(value > 0) {
      this._scrolledWindow.height_request = value;
    } else {
      this._scrolledWindow.height_request = -1;
    }
  }

  public get height(): number {
    return this._scrolledWindow.height_request;
  }

  /**
   * Get whether the source view has code
   * @returns Whether the source view has code
   */
  public get hasCode(): boolean {
    return this.code.trim().length > 0;
  }

  private _selectable = true;

  private _selectableSignalIds: number[] = [];

  /** The style scheme manager */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager */
  private styleManager = Adw.StyleManager.get_default();

  /** The gutter for the left side */
  private leftGutter: GtkSource.Gutter;

  /** The renderer for custom line numbers, used for the hex monitor to display the address instead of line numbers */
  private renderer?: GutterRendererLineNumbers;

  private copyClipboardSignalId?: number;

  /** The line number start value */
  private _lineNumberStart?: number;

  constructor(params: Partial<SourceView.ConstructorProps> = {}) {
    const { lineNumberStart, lineNumbers, noLineNumbers, fitContentHeight, fitContentWidth, height, hexpand, vexpand, readonly, editable, selectable, unselectable, language, code, ...rest } = params;
    super(rest);
    this.setupScrolledWindow();

    if(lineNumberStart !== undefined) {
      this.lineNumberStart = lineNumberStart;
    }
    if(lineNumbers !== undefined) {
      this.lineNumbers = lineNumbers;
    }
    if(noLineNumbers !== undefined) {
      this.noLineNumbers = noLineNumbers;
    }
    if(fitContentHeight !== undefined) {
      this.fitContentHeight = fitContentHeight;
    }
    if(fitContentWidth !== undefined) {
      this.fitContentWidth = fitContentWidth;
    }
    if(height !== undefined) {
      this.height = height;
    }
    if(hexpand !== undefined) {
      this.hexpand = hexpand;
    }
    if(vexpand !== undefined) {
      this.vexpand = vexpand;
    }
    if(readonly !== undefined) {
      this.readonly = readonly;
    }
    if(editable !== undefined) {
      this.editable = editable;
    }
    if(selectable !== undefined) {
      this.selectable = selectable;
    }
    if(unselectable !== undefined) {
      this.unselectable = unselectable;
    }
    if(language !== undefined) {
      this.language = language;
    }
    if(code !== undefined) {
      this.code = code;
    }

    // Get the existing gutter for the left side
    this.leftGutter = this._sourceView.get_gutter(Gtk.TextWindowType.LEFT);

    // Setup line numbers if enabled
    if (this.lineNumbers) {
      this.setupLineNumbers(GutterRendererMode.NORMAL);
    }

    this.language = '6502-assembler';
    this.setupSignalListeners();
    this.updateStyle();

    this.code = 'LDA #$01\nSTA $0200\nLDA #$05\nSTA $0201\nLDA #$08\nSTA $0202'
  }

  private setupScrolledWindow() {
    // Ensure the ScrolledWindow uses the SourceView's adjustments
    this._scrolledWindow.set_vadjustment(this._sourceView.vadjustment);
    this._scrolledWindow.set_hadjustment(this._sourceView.hadjustment);
  }

  /**
   * Setup signal listeners
   *
   * @emits changed - Emitted when the buffer's text changes
   */
  private setupSignalListeners() {
    // cannot use "changed" signal as it triggers many time for pasting
    this.buffer.connect('end-user-action', this.emitChanged.bind(this));
    this.buffer.connect('undo', this.emitChanged.bind(this));
    this.buffer.connect('redo', this.emitChanged.bind(this));

    this.buffer.connect_after('cursor-moved', this.onCursorMoved.bind(this));

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));
  }

  private onCursorMoved(buffer: GtkSource.Buffer) {
    // Redraw the gutter to update the line number highlight
    this.leftGutter.queue_draw();
    this.renderer?.queue_draw();
  }

  /**
   * Setup line numbers with the specified mode
   *
   * @param mode - The line numbering mode (HEX or NORMAL)
   */
  private setupLineNumbers(mode: GutterRendererMode): void {
    // Always hide the default line numbers
    this._sourceView.show_line_numbers = false;

    // Remove existing renderer if it exists
    if (this.renderer) {
      this.leftGutter.remove(this.renderer);
    }

    // Create new renderer with appropriate settings for the mode
    const margin = mode === GutterRendererMode.HEX ? 12 : 6;
    const width = mode === GutterRendererMode.HEX ? 36 : 24;

    this.renderer = new GutterRendererLineNumbers({
      margin_start: margin,
      margin_end: margin,
      width_request: width,
      focus_on_click: true,
      focusable: true,
    });

    // Set properties
    this.renderer.mode = mode;
    if(this._lineNumberStart !== undefined) {
      this.renderer.startValue = this._lineNumberStart;
    }

    // Insert the renderer
    this.leftGutter.insert(this.renderer, 0);
  }

  /**
   * Copy the selected text to the "strg+c" clipboard without spaces
   * @returns
   */
  private onCopyHexClipboard() {
    const buffer = this._sourceView.buffer
    const [hasSelection, start, end] = buffer.get_selection_bounds()

    if (hasSelection) {
      const text = buffer.get_text(start, end, false)
      const cleanedText = text.replace(/\s/g, '')

      const display = this.get_display(); // Gdk.Display.get_default();
      if (!display) {
        console.error('No display found')
        return false;
      }
      const clipboard = display.get_clipboard();

      const value = new GObject.Value();
      value.init(GObject.TYPE_STRING);
      value.set_string(cleanedText);

      const contentProvider = Gdk.ContentProvider.new_for_value(value)
      const success = clipboard.set_content(contentProvider)
      console.log(`Copy to clipboard: ${success ? 'success' : 'failed'}`)

      return true;
    }

    return false
  }

  private selectableChanged() {
    // Disconnect all existing signal handlers
    this._selectableSignalIds.forEach(id => this.disconnect(id));
    this._selectableSignalIds = [];

    // Enable/disable text cursor
    this._sourceView.cursor_visible = this._selectable;

    // Stop here if selection is allowed
    if(this._selectable) {
      return;
    }

    // Prevent selection by double click
    this._selectableSignalIds.push(this._sourceView.connect('extend-selection', (sourceView: GtkSource.View, granularity: Gtk.TextExtendSelection, location: Gtk.TextIter, start: Gtk.TextIter, end: Gtk.TextIter) => {
      GObject.signal_stop_emission_by_name(this._sourceView, 'extend-selection');
    }));

    // Prevent selection
    this._selectableSignalIds.push(this.buffer.connect('mark-set', (buffer: GtkSource.Buffer, location: Gtk.TextIter, mark: Gtk.TextMark) => {
      if(mark.name === 'insert' || mark.name === 'selection_bound') {
        const offset = location.get_offset();
        if(offset !== 0) {
          location.set_offset(0);
          this.buffer.move_mark(mark, location);
          GObject.signal_stop_emission_by_name(this.buffer, 'mark-set');
        }
      }
    }));
  }

  private emitChanged() {
    this.emit("changed");
  };

  /**
   * Update the style of the source view.
   * Used internally to update the style of the source view when the theme changes.
   */
  private updateStyle() {
    const scheme = this.schemeManager.get_scheme(
      this.styleManager.dark ? "Adwaita-dark" : "Adwaita",
    );
    this.buffer.set_style_scheme(scheme);
  };

  /**
   * Set the line number start value
   *
   * @param value - The starting line number
   */
  public set lineNumberStart(value: number | undefined) {
    if (this._lineNumberStart === value || value === undefined) {
      return;
    }

    this._lineNumberStart = value;

    // Update renderer with new start value if it exists
    if (this.renderer) {
      this.renderer.startValue = value;
      this.leftGutter.queue_draw();
    }
  }

  /**
   * Get the line number start value
   *
   * @returns The starting line number
   */
  public get lineNumberStart(): number | undefined {
    return this._lineNumberStart;
  }
}

GObject.type_ensure(SourceView.$gtype)
