import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { MessageConsole } from './message-console.ts'

import Template from './debugger.ui?raw'

import type { Debugger as DebuggerInterface, MonitorOptions, DebuggerOptions } from '@easy6502/6502'

GObject.type_ensure(MessageConsole.$gtype)

interface _Debugger {
  // Child widgets
  _messageConsole: InstanceType<typeof MessageConsole>
}

class _Debugger extends Adw.Bin implements DebuggerInterface {

  private monitor: MonitorOptions = {
    start: 0,
    length: 0
  };

  constructor(options: DebuggerOptions, params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.monitor = options.monitor
  }

  setMonitorRange(startAddress: number, length: number): void {
    this.monitor.start = startAddress;
    this.monitor.length = length;
  }
}

export const Debugger = GObject.registerClass(
  {
    GTypeName: 'Debugger',
    Template,
    InternalChildren: ['messageConsole']
  },
  _Debugger
)
