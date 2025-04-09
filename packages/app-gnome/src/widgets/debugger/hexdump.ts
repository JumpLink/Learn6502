import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { SourceView } from '../source-view.ts'

import { type Assembler, type Hexdump as HexdumpInterface } from '@learn6502/6502'

import Template from './hexdump.blp'

export class Hexdump extends Adw.Bin implements HexdumpInterface {

  // Child widgets
  declare private _sourceView: SourceView

  static {
    GObject.registerClass({
      GTypeName: 'Hexdump',
      Template,
      InternalChildren: ['sourceView']
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }

  public update(assembler: Assembler) {
    this._sourceView.buffer.text = assembler.hexdump({ includeAddress: false, includeSpaces: true, includeNewline: true });
  }
}

GObject.type_ensure(Hexdump.$gtype)