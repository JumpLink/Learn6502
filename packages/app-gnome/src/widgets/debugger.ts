import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { MessageConsole } from './message-console.ts'
import { HexMonitor } from './hex-monitor.ts'
import { DebugInfo } from './debug-info.ts'

import Template from './debugger.ui?raw'

import { type Debugger as DebuggerInterface, type Memory, type Simulator, num2hex, addr2hex } from '@easy6502/6502'

GObject.type_ensure(MessageConsole.$gtype)
GObject.type_ensure(HexMonitor.$gtype)
GObject.type_ensure(DebugInfo.$gtype)

interface _Debugger {
  // Child widgets
  _messageConsole: InstanceType<typeof MessageConsole>
  _hexMonitor: InstanceType<typeof HexMonitor>
  _debugInfo: InstanceType<typeof DebugInfo>
}

class _Debugger extends Adw.Bin implements DebuggerInterface {

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
  }

  public log(message: string): void {
    this._messageConsole.log(message);
  }

  public update(memory: Memory, simulator: Simulator): void {
    this._hexMonitor.update(memory);
    this._debugInfo.update(simulator);
  }

  public reset(): void {
    this._messageConsole.clear();
  }
}

export const Debugger = GObject.registerClass(
  {
    GTypeName: 'Debugger',
    Template,
    InternalChildren: ['messageConsole', 'hexMonitor', 'debugInfo']
  },
  _Debugger
)
