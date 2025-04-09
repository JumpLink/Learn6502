import GObject from '@girs/gobject-2.0'
import Gdk from '@girs/gdk-4.0'
import Gtk from '@girs/gtk-4.0'
import Adw from '@girs/adw-1'
import { SourceView } from '../source-view.ts'
import { copyToClipboard } from '../../utils.ts'

import { type Assembler, type Hexdump as HexdumpInterface } from '@learn6502/6502'

import Template from './hexdump.blp'
export class Hexdump extends Adw.Bin implements HexdumpInterface {

  // Child widgets
  declare private _sourceView: SourceView

  static {
    GObject.registerClass({
      GTypeName: 'Hexdump',
      Template,
      InternalChildren: ['sourceView'],
      Signals: {
        'copy-to-clipboard': {
          param_types: [GObject.TYPE_BOOLEAN, GObject.TYPE_STRING],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    this._sourceView.connect('copy', this.onCopy.bind(this))
  }

  public update(assembler: Assembler) {
    this._sourceView.buffer.text = assembler.hexdump({ includeAddress: false, includeSpaces: true, includeNewline: true });
  }

  private onCopy(sourceView: SourceView, code: string) {
    // Remove all whitespace
    code = code.replace(/\s/g, '');

    // Copy to clipboard
    const success = copyToClipboard(code, sourceView.get_clipboard());
    this.emit('copy-to-clipboard', success, code);
  }

  public clear(): void {
    this._sourceView.buffer.text = '';
  }
}

GObject.type_ensure(Hexdump.$gtype)