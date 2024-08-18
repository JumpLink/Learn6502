import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'

import { Memory, Labels, Simulator, Assembler, AssemblerEvent, SimulatorEvent, DummyMessageConsole, MessageConsole as MessageConsoleInterface } from '@easy6502/6502';

import { Display } from './display.ts'

import Template from './game-console.ui?raw'

GObject.type_ensure(Display.$gtype)

interface _GameConsole {
  // Child widgets
  _display: InstanceType<typeof Display> | undefined
}

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
    this.labels = new Labels(this.console);
    this.simulator = new Simulator(this.console, this.memory, this.labels);
    this.assembler = new Assembler(this.console, this.memory, this.labels);

    this.initialize();
  }

  public assemble(code: string): void {
    this.simulator.reset();
    this.labels.reset();
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

      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.assembler.on('assemble-failure', (event: AssemblerEvent) => {
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.assembler.on('hexdump', (event: AssemblerEvent) => {
      this.console.log(event.message || '');
    });

    this.assembler.on('disassembly', (event: AssemblerEvent) => {
      this.console.log(event.message || '');
    });

    this.simulator.on('stop', (event: SimulatorEvent) => {
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.simulator.on('start', (event: SimulatorEvent) => {
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.simulator.on('reset', (event: SimulatorEvent) => {
      this._display?.reset();
    });

  }
}

export const GameConsole = GObject.registerClass(
  {
    GTypeName: 'GameConsole',
    Template,
    InternalChildren: ['display']
  },
  _GameConsole
)
