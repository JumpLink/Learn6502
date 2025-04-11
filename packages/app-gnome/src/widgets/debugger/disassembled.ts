import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { SourceView } from '../source-view.ts'

import { type Assembler, type Disassembled as DisassembledInterface } from '@learn6502/6502'

import Template from './disassembled.blp'
export class Disassembled extends Adw.Bin implements DisassembledInterface {

  // Child widgets
  declare private _sourceView: SourceView

  static {
    GObject.registerClass({
      GTypeName: 'Disassembled',
      Template,
      InternalChildren: ['sourceView'],
      Signals: {
        'copy': {
          param_types: [GObject.TYPE_STRING],
        },
      },
    }, this);
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    this._sourceView.connect('copy', this.onCopy.bind(this))
  }

  public update(assembler: Assembler) {
    const disassembledData = assembler.disassemble();

    // Extract only the assembly instructions (opCode + formattedArgs)
    const assemblyCode = disassembledData.instructions
      .map(inst => `${inst.opCode} ${inst.formattedArgs}`)
      .join('\n');

    this._sourceView.buffer.text = assemblyCode;
  }

  private onCopy(_sourceView: SourceView, code: string) {
    this.emit('copy', code);
  }

  public clear(): void {
    this._sourceView.buffer.text = '';
  }
}

GObject.type_ensure(Disassembled.$gtype)