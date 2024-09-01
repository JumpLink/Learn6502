import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'

import Template from './source-view.ui?raw'

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
        language: GObject.ParamSpec.string('language', 'Language', 'The language of the source view', GObject.ParamFlags.READWRITE, '6502-assembler'),
        readonly: GObject.ParamSpec.boolean('readonly', 'Readonly', 'Whether the source view is readonly', GObject.ParamFlags.READWRITE, false),
        editable: GObject.ParamSpec.boolean('editable', 'Editable', 'Whether the source view is editable', GObject.ParamFlags.READWRITE, true),
        selectable: GObject.ParamSpec.boolean('selectable', 'Focusable', 'Whether the source view is selectable', GObject.ParamFlags.READWRITE, true),
        unselectable: GObject.ParamSpec.boolean('unselectable', 'Unselectable', 'Whether the source view is unselectable', GObject.ParamFlags.READWRITE, false),
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
    const languageManager = GtkSource.LanguageManager.get_default();
    const assemblyLanguage = languageManager.get_language(language);
    if (!assemblyLanguage) {
      throw new Error(`Language "${language}" not found`)
    }
    this.buffer.set_language(assemblyLanguage);
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

  private _selectable = true;

  private _selectableSignalIds: number[] = [];

  /** The style scheme manager */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager */
  private styleManager = Adw.StyleManager.get_default();

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.language = '6502-assembler';
    this.setupSignalListeners();
    this.updateStyle();
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

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));
  }

  private selectableChanged() {
    console.log('selectableChanged', this._selectable);
    // Disable text selection
    this._sourceView.set_cursor_visible(this._selectable);

    // Disconnect all existing signal handlers
    this._selectableSignalIds.forEach(id => this.disconnect(id));
    this._selectableSignalIds = [];

    // Stop here if selectable is true
    if (this._selectable) {
      return;
    }

    // Prevent copy 
    this._selectableSignalIds.push(this._sourceView.connect('copy-clipboard', () => {
      GObject.signal_stop_emission_by_name(this._sourceView, 'copy-clipboard');
    }));

    // En-/disable selection via keyboard
    this._selectableSignalIds.push(this.buffer.connect('cursor-moved', (buffer: GtkSource.Buffer) => {
      GObject.signal_stop_emission_by_name(this.buffer, 'cursor-moved');
    }));

    // TODO: Prevent mouse selection
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
