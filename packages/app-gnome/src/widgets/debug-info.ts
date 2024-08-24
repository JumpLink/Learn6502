import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { type Simulator, num2hex, addr2hex } from '@easy6502/6502'

import Template from './debug-info.ui?raw'

interface _DebugInfo {
  // Child widgets
  _textView: Gtk.TextView
}

class _DebugInfo extends Adw.Bin {

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }

  public update(simulator: Simulator) {
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;
    let markup = "A=$" + num2hex(regA) + " X=$" + num2hex(regX) + " Y=$" + num2hex(regY) + "\n";
    markup += "SP=$" + num2hex(regSP) + " PC=$" + addr2hex(regPC);
    markup += "\n";
    markup += "NV-BDIZC\n";
    for (let i = 7; i >= 0; i--) {
      markup += regP >> i & 1;
    }
    this._textView.buffer.text = markup;
  }
}

export const DebugInfo = GObject.registerClass(
  {
    GTypeName: 'DebugInfo',
    Template,
    InternalChildren: ['textView']
  },
  _DebugInfo
)
