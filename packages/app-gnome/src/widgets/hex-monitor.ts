import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import type { Memory, MonitorOptions } from '@easy6502/6502'

import Template from './hex-monitor.ui?raw'

interface _HexMonitor {
  // Child widgets
  _textView: Gtk.TextView
}

class _HexMonitor extends Adw.Bin {

  start: number = 0x0;
  length: number = 0xffff;

  constructor(params: Partial<Adw.Bin.ConstructorProps> & MonitorOptions) {
    super(params)
  }

  public update(memory: Memory) {

    let content = '';

    const end = this.start + this.length - 1;

    if (!isNaN(this.start) && !isNaN(this.length) && this.start >= 0 && this.length > 0 && end <= 0xffff) {
      content = memory.format(this.start, this.length);
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this._textView.buffer.set_text(content, content.length);
  }

  public setRange(startAddress: number, length: number): void {
    this.start = startAddress;
    this.length = length;
  }

}

export const HexMonitor = GObject.registerClass(
  {
    GTypeName: 'HexMonitor',
    Template,
    InternalChildren: ['textView']
  },
  _HexMonitor
)
