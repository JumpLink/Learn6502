import GObject from '@girs/gobject-2.0'
import Gtk from '@girs/gtk-4.0'
import Adw from '@girs/adw-1'

import { MessageConsole } from './message-console.ts'
import { HexMonitor } from './hex-monitor.ts'
import { Hexdump } from './hexdump.ts'
import { DebugInfo } from './debug-info.ts'

import Template from './debugger.blp'

import { type Debugger as DebuggerInterface, type Memory, type Simulator, Assembler, DebuggerState, throttle } from '@learn6502/6502'

export class Debugger extends Adw.Bin implements DebuggerInterface {

  // Properties
  declare private _state: DebuggerState

  // Child widgets
  declare private _stack: Gtk.Stack
  declare private _messageConsole: MessageConsole
  declare private _hexMonitor: HexMonitor
  declare private _hexdump: Hexdump
  declare private _debugInfo: DebugInfo
  declare private _statusPage: Adw.StatusPage

  static {
    GObject.registerClass({
      GTypeName: 'Debugger',
      Template,
      InternalChildren: ['stack', 'messageConsole', 'hexMonitor', 'hexdump', 'debugInfo', 'statusPage'],
      Signals: {
        'hexdump-copy': {
          param_types: [GObject.TYPE_STRING],
        },
        'hexmonitor-copy': {
          param_types: [GObject.TYPE_STRING],
        },
      },
      Properties: {
        // TypeScript enums are numbers by default
        'state': GObject.ParamSpec.uint('state', 'State', 'Debugger state', GObject.ParamFlags.READWRITE, DebuggerState.INITIAL, DebuggerState.RESET, DebuggerState.INITIAL)
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

  /** A list of handler IDs for the signals we connect to. */
  private handlerIds: number[] = [];

  // Reference to the last memory update for refreshing when monitor options change
  private memory: Memory | null = null;

  constructor(binParams: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(binParams)
    this.setupSignalHandlers();
    this.state = DebuggerState.INITIAL;
  }

  /** Call this when the ApplicationWindow is closed. */
  public close(): void {
    this.removeSignalHandlers();
  }

  public log(message: string): void {
    this._messageConsole.log(message);
  }

  /**
   * Internal update method for the debugger display.
   * Updates only frequently changing components (memory monitor and debug info).
   * Does not update hexdump as it only needs to change when code is reassembled.
   * @param memory Current state of system memory
   * @param simulator Current state of the 6502 simulator
   */
  private _update(memory: Memory, simulator: Simulator): void {
    this.memory = memory;
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  /**
   * Throttled public update method for the debugger display.
   * Called frequently during program execution but limited to once every 349ms.
   * Only updates dynamic components (memory and debug info), not the hexdump.
   * @param memory The memory to update the hex monitor
   * @param simulator The simulator to update the debug info
   * @param assembler Parameter exists for API compatibility but is not used here
   */
  public update = throttle(this._update.bind(this), 349); // Prime number

  /**
   * Updates the memory monitor display when memory content changes.
   * Can be called frequently during program execution.
   * @param memory Current state of system memory
   */
  public updateMonitor(memory: Memory): void {
    this._hexMonitor.update(memory);
  }

  /**
   * Updates debug information like registers and flags.
   * Can be called frequently during program execution.
   * @param simulator Current state of the 6502 simulator
   */
  public updateDebugInfo(simulator: Simulator): void {
    this._debugInfo.update(simulator);
  }

  /**
   * Updates the hexdump display of the assembled program.
   * Should only be called when the assembly code has been modified and reassembled.
   * @param assembler Assembler instance containing the new program code
   */
  public updateHexdump(assembler: Assembler): void {
    this._hexdump.update(assembler);
  }

  public reset(): void {
    this._messageConsole.clear();
    this._hexMonitor.clear();
    this._hexdump.clear();
    this.state = DebuggerState.RESET;
  }

  private onStateChanged(): void {
    if(this.state === DebuggerState.INITIAL) {
      this._stack.set_visible_child_name('initial');
    } else  {
      this._stack.set_visible_child_name('debugger');
    }
  }

  private onParamChanged(_self: Debugger, pspec: GObject.ParamSpec): void {
    switch (pspec.name) {
      case 'state':
        this.onStateChanged();
        break;
    }
  }

  private onHexMonitorChanged(): void {
    // Refresh the view if we have memory data
    if (this.memory) {
      this.updateMonitor(this.memory);
    }
  }

  private onCopyToClipboard(self: Hexdump | HexMonitor, code: string): void {
    if (self instanceof Hexdump) {
      this.emit('hexdump-copy', code);
    } else if (self instanceof HexMonitor) {
      this.emit('hexmonitor-copy', code);
    } else {
      console.error('[Debugger] Unknown widget type', self);
    }
  }

  private setupSignalHandlers(): void {
    this.handlerIds.push(this.connect('notify', this.onParamChanged.bind(this)));

    // Connect to the Hexdump's copy signal
    this.handlerIds.push(this._hexdump.connect('copy', this.onCopyToClipboard.bind(this)));

    // Connect to the HexMonitor's copy signal
    this.handlerIds.push(this._hexMonitor.connect('copy', this.onCopyToClipboard.bind(this)));

    // Connect to the HexMonitor's changed signal
    this.handlerIds.push(this._hexMonitor.connect('changed', this.onHexMonitorChanged.bind(this)));
  }

  private removeSignalHandlers(): void {
    try {
      this.handlerIds.forEach(id => this.disconnect(id));
    } catch (error) {
      console.error('[Debugger] Failed to remove signal handlers', error);
    }
    this.handlerIds = [];
  }
}

GObject.type_ensure(Debugger.$gtype)
