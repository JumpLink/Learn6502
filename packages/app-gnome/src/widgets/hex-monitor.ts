import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import { SourceView } from './source-view.ts'

import type { Memory, HexMonitorOptions, HexMonitor as HexMonitorInterface } from '@easy6502/6502'

import Template from './hex-monitor.blp'

GObject.type_ensure(SourceView.$gtype)

export interface HexMonitor {
  // Child widgets
  _sourceView: SourceView
}

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
export class HexMonitor extends Adw.Bin implements HexMonitorInterface {

  static {
    GObject.registerClass({
      GTypeName: 'HexMonitor',
      Template,
      InternalChildren: ['sourceView'],
    }, this);
  }

  public options: HexMonitorOptions = {
    start: 0x0,
    length: 0xffff,
  };

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }

  public update(memory: Memory) {

    let content = '';

    const end = this.options.start + this.options.length - 1;

    if (!isNaN(this.options.start) && !isNaN(this.options.length) && this.options.start >= 0 && this.options.length > 0 && end <= 0xffff) {
      content = memory.format({ start: this.options.start, length: this.options.length, includeAddress: false, includeSpaces: true, includeNewline: true });
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this._sourceView.code = content;
  }

  public setOptions(options: Partial<HexMonitorOptions>): void {
    this.options = { ...this.options, ...options };
  }

}
