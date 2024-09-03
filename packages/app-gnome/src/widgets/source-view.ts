import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'
import Gdk from '@girs/gdk-4.0'
import Template from './source-view.ui?raw'

import { GutterRendererAddress } from '../gutter-renderer-address.ts'

export interface SourceView {
  /** The SourceView that displays the buffer's display */
  _sourceView: GtkSource.View
}

GtkSource.init()

/**
 * @class SourceView to show 6502 assembly code
 * 
 * @emits changed - Emitted when the buffer's text changes
 */
export class SourceView extends Adw.Bin {

  static {
    GObject.registerClass({
      GTypeName: 'SourceView',
      Template,
      InternalChildren: ['sourceView'],
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
      },
    }, this);
  }

  /** The source code of the source view */
  public set code(value: string) {
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
    if(language === 'hex') {
      this.setupHexLanguage();
    } else {
      this.disconnectHexLanguage();
    }
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
    console.log('selectable', value);
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
    this._sourceView.show_line_numbers = value;
  }

  /**
   * Get the line numbers property of the source view
   * 
   * @returns Whether the source view has line numbers
   */
  public get lineNumbers(): boolean {
    return this._sourceView.show_line_numbers;
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

  private _selectable = true;

  private _selectableSignalIds: number[] = [];

  /** The style scheme manager */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager */
  private styleManager = Adw.StyleManager.get_default();

  /** The gutter for the left side */
  private leftGutter: GtkSource.Gutter;

  /** The renderer for custom line numbers, used for the hex monitor to display the address instead of line numbers */
  private renderer?: GutterRendererAddress;

  private copyClipboardSignalId?: number;

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.language = '6502-assembler';
    this.setupSignalListeners();
    this.updateStyle();
    // Get the existing gutter for the left side
    this.leftGutter = this._sourceView.get_gutter(Gtk.TextWindowType.LEFT);
    this.code = 'LDA #$01\nSTA $0200\nLDA #$05\nSTA $0201\nLDA #$08\nSTA $0202'
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

  private setupHexLanguage() {
    this.setupHexAddressLineNumbers();
    this.copyClipboardSignalId = this._sourceView.connect_after('copy-clipboard', this.onCopyHexClipboard.bind(this));
    this._sourceView.highlight_current_line = true;
  }

  private disconnectHexLanguage() {
    if(this.copyClipboardSignalId) {
      this._sourceView.disconnect(this.copyClipboardSignalId);
    }
    if(this.renderer) {
      this.leftGutter.remove(this.renderer);
    }
    this._sourceView.highlight_current_line = false;
  }

  private setupHexAddressLineNumbers(): void {
    // Hide the default line numbers
    this._sourceView.show_line_numbers = false;

    // Add custom line numbers renderer
    this.renderer = new GutterRendererAddress({
      margin_start: 12,
      margin_end: 12,
      width_request: 36,
      focus_on_click: true,
      focusable: true,
    });

    // Insert the custom line numbers renderer
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
}
