import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import { Memory, Labels, Simulator, Assembler, type AssemblerEvent, type SimulatorEvent, type LabelsEvent } from '@learn6502/6502';

import { Display } from '../widgets/game-console/display.ts'
import { GamePad } from '../widgets/game-console/game-pad.ts'

import Template from './game-console.blp'

export interface GameConsole {
  // GObject signals
  connect(id: string, callback: (...args: any[]) => any): number;
  connect_after(id: string, callback: (...args: any[]) => any): number;
  emit(id: string, ...args: any[]): void;

  // Custom signals
  connect(signal: 'assemble-success', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  connect_after(signal: 'assemble-success', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  emit(signal: 'assemble-success', pspec: AssemblerEvent): void;

  connect(signal: 'assemble-failure', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  connect_after(signal: 'assemble-failure', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  emit(signal: 'assemble-failure', pspec: AssemblerEvent): void;

  connect(signal: 'hexdump', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  connect_after(signal: 'hexdump', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  emit(signal: 'hexdump', pspec: AssemblerEvent): void;

  connect(signal: 'disassembly', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  connect_after(signal: 'disassembly', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  emit(signal: 'disassembly', pspec: AssemblerEvent): void;

  connect(signal: 'assemble-info', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  connect_after(signal: 'assemble-info', callback: (_source: this, pspec: AssemblerEvent) => void): number;
  emit(signal: 'assemble-info', pspec: AssemblerEvent): void;

  connect(signal: 'stop', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'stop', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'stop', pspec: SimulatorEvent): void;

  connect(signal: 'start', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'start', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'start', pspec: SimulatorEvent): void;

  connect(signal: 'reset', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'reset', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'reset', pspec: SimulatorEvent): void;

  connect(signal: 'step', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'step', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'step', pspec: SimulatorEvent): void;

  connect(signal: 'multistep', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'multistep', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'multistep', pspec: SimulatorEvent): void;

  connect(signal: 'pseudo-op', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'pseudo-op', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'pseudo-op', pspec: SimulatorEvent): void;

  connect(signal: 'simulator-info', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'simulator-info', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'simulator-info', pspec: SimulatorEvent): void;

  connect(signal: 'simulator-failure', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  connect_after(signal: 'simulator-failure', callback: (_source: this, pspec: SimulatorEvent) => void): number;
  emit(signal: 'simulator-failure', pspec: SimulatorEvent): void;

  connect(signal: 'labels-info', callback: (_source: this, pspec: LabelsEvent) => void): number;
  connect_after(signal: 'labels-info', callback: (_source: this, pspec: LabelsEvent) => void): number;
  emit(signal: 'labels-info', pspec: LabelsEvent): void;

  connect(signal: 'labels-failure', callback: (_source: this, pspec: LabelsEvent) => void): number;
  connect_after(signal: 'labels-failure', callback: (_source: this, pspec: LabelsEvent) => void): number;
  emit(signal: 'labels-failure', pspec: LabelsEvent): void;

  connect(signal: 'gamepad-pressed', callback: (_source: this, pspec: number) => void): number;
  connect_after(signal: 'gamepad-pressed', callback: (_source: this, pspec: number) => void): number;
  emit(signal: 'gamepad-pressed', pspec: number): void;
}

/**
 * The GameConsole widget.
 * @emits assemble-success - Emitted when the assembler successfully assembled the code.
 * @emits assemble-failure - Emitted when the assembler failed to assemble the code.
 * @emits hexdump - Emitted when the assembler hexdumps the code.
 * @emits disassembly - Emitted when the assembler disassembles the code.
 * @emits assemble-info - Emitted when the assembler has an info message.
 * @emits stop - Emitted when the simulator stops.
 * @emits start - Emitted when the simulator starts.
 * @emits reset - Emitted when the simulator resets.
 * @emits step - Emitted when the simulator executes a single step.
 * @emits multistep - Emitted when the simulator executes multiple steps.
 * @emits labels-info - Emitted when the labels has a info message.
 * @emits labels-failure - Emitted when the labels fail to parse.
 * @emits gamepad-pressed - Emitted when a gamepad button is pressed.
 */
export class GameConsole extends Adw.Bin {

  // Child widgets
  declare private _display: Display
  declare private _gamePad: GamePad

  static {
    GObject.registerClass({
      GTypeName: 'GameConsole',
      Template,
      InternalChildren: ['display', 'gamePad'],
      Signals: {
        'assemble-success': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'assemble-failure': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'hexdump': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'disassembly': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'assemble-info': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'stop': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'start': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'reset': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'step': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'multistep': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'goto': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'pseudo-op': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'simulator-info': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'simulator-failure': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'labels-info': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'labels-failure': {
          param_types: [GObject.TYPE_JSOBJECT],
        },
        'gamepad-pressed': {
          param_types: [GObject.TYPE_INT],
        },
      },
    }, this);
  }

  /** A list of handler IDs for the signals we connect to. */
  private gamepadHandlerIds: number[] = [];

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

  get memory() {
    return this._memory;
  }

  get labels() {
    return this._labels;
  }

  get simulator() {
    return this._simulator;
  }

  get assembler() {
    return this._assembler;
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    this._memory = new Memory();
    this._labels = new Labels();
    this._simulator = new Simulator(this._memory, this._labels);
    this._assembler = new Assembler(this._memory, this._labels);

    this.initialize();
  }

  public assemble(code: string): void {
    this._simulator.reset();
    this._labels.reset();
    this._assembler.assembleCode(code);
  }

  public run(): void {
    this._simulator.stopStepper();
    this._simulator.runBinary();
  }

  public hexdump(): void {
    this._assembler.hexdump({ includeAddress: false, includeSpaces: true, includeNewline: true });
  }

  public disassemble(): void {
    this._assembler.disassemble();
  }

  public stop(): void {
    this._simulator.stop();
  }

  public reset(): void {
    this._simulator.reset();
    this._labels.reset();
  }

  public step(): void {
    this._simulator.debugExecStep();
  }

  public goto(address: string): void {
    this._simulator.gotoAddr(address);
  }

  public gamepadPress(buttonName: 'Left' | 'Right' | 'Up' | 'Down' | 'A' | 'B'): void {
    this._gamePad.press(buttonName);
  }

  /** Call this when the ApplicationWindow is closed. */
  public close(): void {
    this.stop();
    this.removeSignalHandlers();
  }

  /**
   * Initializes the simulator widget and sets up event listeners.
   */
  private initialize(): void {
    this._display?.initialize(this._memory);
    this._simulator.reset();

    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for various UI elements.
   */
  private setupEventListeners(): void {

    this._assembler.on('assemble-success', (event: AssemblerEvent) => {
      this._memory.set(this._assembler.getCurrentPC(), 0x00); // Set a null byte at the end of the code

      // Forward the event as a signal
      this.emit('assemble-success', event);
    });

    this._assembler.on('assemble-failure', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('assemble-failure', event);
    });

    this._assembler.on('hexdump', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('hexdump', event);
    });

    this._assembler.on('disassembly', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('disassembly', event);
    });

    this._assembler.on('assemble-info', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('assemble-info', event);
    });

    this._simulator.on('stop', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('stop', event);
    });

    this._simulator.on('start', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('start', event);
    });

    this._simulator.on('reset', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('reset', event);
    });

    this._simulator.on('step', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('step', event);
    });

    this._simulator.on('multistep', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('multistep', event);
    });

    this._simulator.on('goto', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('goto', event);
    });

    this._simulator.on('pseudo-op', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('pseudo-op', event);
    });

    this._simulator.on('simulator-info', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('simulator-info', event);
    });

    this._simulator.on('simulator-failure', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('simulator-failure', event);
    });

    this._labels.on('labels-info', (event: LabelsEvent) => {
      // Forward the event as a signal
      this.emit('labels-info', event);
    });

    this._labels.on('labels-failure', (event: LabelsEvent) => {
      // Forward the event as a signal
      this.emit('labels-failure', event);
    });

    this.gamepadHandlerIds.push(this._gamePad.connect('gamepad-pressed', (_source: GamePad, key: number) => {
      this.emit('gamepad-pressed', key);
      this._memory.storeKeypress(key);
    }));
  }

  private removeSignalHandlers(): void {
    try {
      this.gamepadHandlerIds.forEach(id => this._gamePad.disconnect(id));
    } catch (error) {
      console.error('[GameConsole] Failed to remove signal handlers', error)
    }
    this.gamepadHandlerIds = [];
  }
}

GObject.type_ensure(GameConsole.$gtype)