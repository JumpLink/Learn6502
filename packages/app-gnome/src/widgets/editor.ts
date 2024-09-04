import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { SourceView } from './source-view.ts'

import Template from './editor.ui?raw'

GObject.type_ensure(SourceView.$gtype)

export interface Editor {
  /** The SourceView that displays the buffer's display */
  _sourceView: SourceView
}

/**
 * @class Editor to edit 6502 assembly code
 * 
 * @emits changed - Emitted when the buffer's text changes
 */
export class Editor extends Adw.Bin {

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
