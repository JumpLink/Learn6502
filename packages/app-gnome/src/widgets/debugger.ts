import GObject from '@girs/gobject-2.0'
import Gtk from '@girs/gtk-4.0'
import Adw from '@girs/adw-1'

import { MessageConsole } from './message-console.ts'
import { HexMonitor } from './hex-monitor.ts'
import { DebugInfo } from './debug-info.ts'

import Template from './debugger.ui?raw'

import { type Debugger as DebuggerInterface, type Memory, type Simulator, DebuggerState, type DebuggerOptions, throttle } from '@easy6502/6502'

GObject.type_ensure(MessageConsole.$gtype)
GObject.type_ensure(HexMonitor.$gtype)
GObject.type_ensure(DebugInfo.$gtype)

export interface Debugger {
  // Properties
  _state: DebuggerState

  // Child widgets
  _stack: Gtk.Stack
  _messageConsole: MessageConsole
  _hexMonitor: HexMonitor
  _debugInfo: DebugInfo
  _statusPage: Adw.StatusPage
}

export class Debugger extends Adw.Bin implements DebuggerInterface {

  static {
    GObject.registerClass({
      GTypeName: 'Debugger',
      Template,
      InternalChildren: ['stack', 'messageConsole', 'hexMonitor', 'debugInfo', 'statusPage'],
      Properties: {
        // TypeScript enums are numbers by default
        'state': GObject.ParamSpec.uint('state', 'State', 'Debugger state', GObject.ParamFlags.READWRITE, DebuggerState.INITIAL, DebuggerState.RESET, DebuggerState.RESET)
      },
    }, this);
  }

  public get state(): DebuggerState {
    return this._state;
  }

  public set state(value: DebuggerState) {
    console.log('set state', value, this._state);
    if (this._state !== value) {
      this._state = value;
      this.notify('state');
    }
  }

  // TODO: Currently unused
  public readonly options: DebuggerOptions = {
    monitor: {
      start: 0x0000,
      length: 0xFFFF
    }
  }

  private handlerIds: number[] = [];

  constructor(binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams)
    this.setupSignalHandlers();
    this.state = DebuggerState.INITIAL;
  }

  public log(message: string): void {
    this._messageConsole.log(message);
  }

  #update(memory: Memory, simulator: Simulator): void {
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  /**
   * Update the debugger.
   * @note This is throttled to 349ms to prevent excessive CPU usage.
   * @param memory - The memory to update the hex monitor.
   * @param simulator - The simulator to update the debug info.
   */
  public update = throttle(this.#update.bind(this), 349); // Prime number

  public updateMonitor(memory: Memory): void {
    this._hexMonitor.update(memory);
  }

  public updateDebugInfo(simulator: Simulator): void {
    this._debugInfo.update(simulator);
  }

  public reset(): void {
    console.log('reset');
    this._messageConsole.clear();
    this.state = DebuggerState.RESET;
  }

  private onStateChanged(): void {
    console.log('state changed', this.state);
    if(this.state === DebuggerState.INITIAL) {
      this._stack.set_visible_child_name('initial');
    } else  {
      this._stack.set_visible_child_name('debugger');
    }
  }

  private onParamChanged(_self: Debugger, pspec: GObject.ParamSpec): void {
    console.log('param changed', pspec.name);
    switch (pspec.name) {
      case 'state':
        this.onStateChanged();
        break;
    }
  }

  private setupSignalHandlers(): void {
    this.handlerIds.push(this.connect('notify', this.onParamChanged.bind(this)));
    this.handlerIds.push(this.connect_after('destroy', this.onDestroy.bind(this)));
  }

  private removeSignalHandlers(): void {
    this.handlerIds.forEach(id => this.disconnect(id));
    this.handlerIds = [];
    console.log('remove signal handlers');
  }

  // TODO: Not called
  onDestroy(): void {
    console.log('destroy');
    this.removeSignalHandlers();
    this.run_dispose();
  }
}
