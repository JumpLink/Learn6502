import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'
import { SourceView } from './source-view.ts'
import { QuickHelp } from './mdx/quick-help.ts'

import Template from './editor.blp'

/**
 * @class Editor to edit 6502 assembly code
 *
 * @emits changed - Emitted when the buffer's text changes
 */
export class Editor extends Adw.Bin {

  // Child widgets

  /** The SourceView that displays the buffer's display */
  declare private _sourceView: SourceView

  /** The QuickHelp that displays the quick help */
  declare private _quickHelp: QuickHelp

  /** The ScrolledWindow that contains the quick help */
  declare private _scrolledWindow: Gtk.ScrolledWindow

  static {
    GObject.registerClass({
      GTypeName: 'Editor',
      Template,
      InternalChildren: ['sourceView', 'quickHelp', 'scrolledWindow'],
      Signals: {
        'changed': {
          param_types: [],
        },
      },
      Properties: {
        code: GObject.ParamSpec.string('code', 'Code', 'The source code of the editor', GObject.ParamFlags.READWRITE, ''),
      },
    }, this);
  }

  public set code(value: string) {
    if (this.code === value) return;
    this._sourceView.code = value;
    this.notify('code');
    this.onUpdate();
  }

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
   * @returns Whether the editor has code
   */
  public get hasCode(): boolean {
    const hasCode = this.code.trim().length > 0;
    return hasCode;
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    this.buffer.connect('changed', () => {
      this.onUpdate();
    });
  }

  private onUpdate() {
    this.emit("changed");
  };

}

GObject.type_ensure(Editor.$gtype)
