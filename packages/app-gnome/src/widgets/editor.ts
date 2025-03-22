import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { SourceView } from './source-view.ts'

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

  static {
    GObject.registerClass({
      GTypeName: 'Editor',
      Template,
      InternalChildren: ['sourceView'],
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
    this._sourceView.code = value;
    this.onUpdate();
  }

  public get code(): string {
    return this._sourceView.code;
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }

  private onUpdate() {
    this.emit("changed");
  };

}

GObject.type_ensure(Editor.$gtype)