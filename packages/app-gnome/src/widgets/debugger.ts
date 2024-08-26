import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'

import { MessageConsole } from './message-console.ts'
import { HexMonitor } from './hex-monitor.ts'
import { DebugInfo } from './debug-info.ts'

import Template from './debugger.ui?raw'

import { type Debugger as DebuggerInterface, type Memory, type Simulator, DebuggerState, type DebuggerOptions } from '@easy6502/6502'

GObject.type_ensure(MessageConsole.$gtype)
GObject.type_ensure(HexMonitor.$gtype)
GObject.type_ensure(DebugInfo.$gtype)

export interface Debugger {
  // Child widgets
  _messageConsole: MessageConsole
  _hexMonitor: HexMonitor
  _debugInfo: DebugInfo
}

export class Debugger extends Adw.Bin implements DebuggerInterface {

  public state = DebuggerState.INITIAL;

  static {
    GObject.registerClass({
      GTypeName: 'Debugger',
      Template,
      InternalChildren: ['messageConsole', 'hexMonitor', 'debugInfo']
    }, this);
  }

  constructor(public readonly options: DebuggerOptions, binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams)
  }

  public log(message: string): void {
    this._messageConsole.log(message);
  }

  public update(memory: Memory, simulator: Simulator): void {
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  public updateMonitor(memory: Memory): void {
    this._hexMonitor.update(memory);
  }

  public updateDebugInfo(simulator: Simulator): void {
    this._debugInfo.update(simulator);
  }

  public reset(): void {
    this._messageConsole.clear();
    this.state = DebuggerState.RESET;
  }
}
