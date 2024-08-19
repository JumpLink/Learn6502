import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import { Memory, Labels, Simulator, Assembler, AssemblerEvent, SimulatorEvent, DummyMessageConsole, MessageConsole as MessageConsoleInterface, LabelsEvent } from '@easy6502/6502';

import { Display } from './display.ts'

import Template from './game-console.ui?raw'

GObject.type_ensure(Display.$gtype)

interface _GameConsole {
  // Child widgets
  _display: InstanceType<typeof Display> | undefined

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

  connect(signal: 'labels-info', callback: (_source: this, pspec: LabelsEvent) => void): number;
  connect_after(signal: 'labels-info', callback: (_source: this, pspec: LabelsEvent) => void): number;
  emit(signal: 'labels-info', pspec: LabelsEvent): void;

  connect(signal: 'labels-failure', callback: (_source: this, pspec: LabelsEvent) => void): number;
  connect_after(signal: 'labels-failure', callback: (_source: this, pspec: LabelsEvent) => void): number;
  emit(signal: 'labels-failure', pspec: LabelsEvent): void;
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
 */
class _GameConsole extends Adw.Bin {

  private console: MessageConsoleInterface;
  private memory: Memory;
  private labels: Labels;
  private simulator: Simulator;
  private assembler: Assembler;

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)

    this.console = new DummyMessageConsole();
    this.memory = new Memory();
    this.labels = new Labels();
    this.simulator = new Simulator(this.console, this.memory, this.labels);
    this.assembler = new Assembler(this.memory, this.labels);

    this.initialize();
  }

  public assemble(code: string): void {
    this.simulator.reset();
    this.labels.reset();
    this.console.clear();
    this.assembler.assembleCode(code);
  }

  public run(): void {
    this.simulator.stopStepper();
    this.simulator.runBinary();
  }

  public hexdump(): void {
    this.assembler.hexdump();
  }

  public disassemble(): void {
    this.assembler.disassemble();
  }

  public stop(): void {
    this.simulator.stop();
  }

  public reset(): void {
    this.simulator.reset();
  }

  public step(): void {
    this.simulator.debugExecStep();
  }

  /**
   * Initializes the simulator widget and sets up event listeners.
   */
  private initialize(): void {
    this._display?.initialize();
    this.simulator.reset();

    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for various UI elements.
   */
  private setupEventListeners(): void {

    this.assembler.on('assemble-success', (event: AssemblerEvent) => {
      this.memory.set(this.assembler.getCurrentPC(), 0x00); // Set a null byte at the end of the code

      // Forward the event as a signal
      this.emit('assemble-success', event);
    });

    this.assembler.on('assemble-failure', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('assemble-failure', event);
    });

    this.assembler.on('hexdump', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('hexdump', event);
    });

    this.assembler.on('disassembly', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('disassembly', event);
    });

    this.assembler.on('assemble-info', (event: AssemblerEvent) => {
      // Forward the event as a signal
      this.emit('assemble-info', event);
    });

    this.simulator.on('stop', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('stop', event);
    });

    this.simulator.on('start', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('start', event);
    });

    this.simulator.on('reset', (event: SimulatorEvent) => {
      this._display?.reset();

      // Forward the event as a signal
      this.emit('reset', event);
    });

    this.simulator.on('step', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('step', event);
    });

    this.simulator.on('multistep', (event: SimulatorEvent) => {
      // Forward the event as a signal
      this.emit('multistep', event);
    });

    this.labels.on('labels-info', (event: LabelsEvent) => {
      // Forward the event as a signal
      this.emit('labels-info', event);
    });

    this.labels.on('labels-failure', (event: LabelsEvent) => {
      // Forward the event as a signal
      this.emit('labels-failure', event);
    });
  }
}

export const GameConsole = GObject.registerClass(
  {
    GTypeName: 'GameConsole',
    Template,
    InternalChildren: ['display'],
    Signals: {
      'assemble-success': {
        // TODO: Fix this, see https://github.com/gjsify/ts-for-gir/pull/189
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & AssemblerEvent>],
      },
      'assemble-failure': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & AssemblerEvent>],
      },
      'hexdump': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & AssemblerEvent>],
      },
      'disassembly': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & AssemblerEvent>],
      },
      'assemble-info': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & AssemblerEvent>],
      },
      'stop': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & SimulatorEvent>],
      },
      'start': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & SimulatorEvent>],
      },
      'reset': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & SimulatorEvent>],
      },
      'step': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & SimulatorEvent>],
      },
      'multistep': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & SimulatorEvent>],
      },
      'labels-info': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & LabelsEvent>],
      },
      'labels-failure': {
        param_types: [(GObject as any).TYPE_JSOBJECT as GObject.GType<Object & LabelsEvent>],
      },
    },
  },
  _GameConsole
)
