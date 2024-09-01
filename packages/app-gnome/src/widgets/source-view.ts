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
      },
    }, this);
  }

  public set code(value: string) {
    this.buffer.text = value;
    this.onUpdate();
  }

  public get code(): string {
    return this.buffer.text;
  }

  public get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer as GtkSource.Buffer;
  }

  /** The style scheme manager */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager */
  private styleManager = Adw.StyleManager.get_default();

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupLanguage();
    this.setupSignalListeners();
    this.updateStyle();
    this.code = 'LDA #$01\nSTA $0200\nLDA #$05\nSTA $0201\nLDA #$08\nSTA $0202'
  }

  private setupLanguage() {
    const languageManager = GtkSource.LanguageManager.get_default();
    const assemblyLanguage = languageManager.get_language('6502-assembler');
    if (!assemblyLanguage) {
      throw new Error('Assembly language not found')
    }
    this.buffer.set_language(assemblyLanguage);
  }

  private setupSignalListeners() {
    // cannot use "changed" signal as it triggers many time for pasting
    this.buffer.connect('end-user-action', this.onUpdate.bind(this));
    this.buffer.connect('undo', this.onUpdate.bind(this));
    this.buffer.connect('redo', this.onUpdate.bind(this));

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));
  }

  private onUpdate() {
    this.emit("changed");
  };

  private updateStyle() {
    const scheme = this.schemeManager.get_scheme(
      this.styleManager.dark ? "Adwaita-dark" : "Adwaita",
    );
    this.buffer.set_style_scheme(scheme);
  };
}
