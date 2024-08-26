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
  // Properties
  _state: DebuggerState

  // Child widgets
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
      InternalChildren: ['messageConsole', 'hexMonitor', 'debugInfo', 'statusPage'],
      Properties: {
        // TypeScript enums are numbers by default
        'state': GObject.ParamSpec.uint('state', 'State', 'Debugger state', GObject.ParamFlags.READWRITE, DebuggerState.INITIAL, DebuggerState.RESET, DebuggerState.RESET)
      },
      Signals: {
        'state-changed': {
          flags: GObject.SignalFlags.RUN_FIRST,
          returnType: GObject.TYPE_NONE,
          paramTypes: [GObject.TYPE_UINT],
        },
      },
    }, this);
  }

  public get state(): DebuggerState {
    return this._state;
  }

  public set state(value: DebuggerState) {
    if (this._state !== value) {
      this._state = value;
      this.notify('state');
    }
  }

  constructor(public readonly options: DebuggerOptions, binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams)
    this.setupSignalHandlers();
    this.state = DebuggerState.INITIAL;
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

  private onStateChanged(): void {
    console.log('state changed', this.state);
    if(this.state === DebuggerState.INITIAL) {
        this._statusPage.set_title('Debugger');
        this._statusPage.set_description('Debug your 6502 assembly code');
        this._statusPage.set_icon_name('bug-symbolic');
    } else  {
        this._statusPage.set_title('');
        this._statusPage.set_description(null);
        this._statusPage.set_icon_name(null);
    }
  }

  private onParamChanged(_self: Debugger, pspec: GObject.ParamSpec): void {
    switch (pspec.name) {
      case 'state':
        this.onStateChanged();
        break;
    }
  }

  private setupSignalHandlers(): void {
    // TODO: Fix crash on exit application
    this.connect('notify', this.onParamChanged.bind(this));
  }
}
