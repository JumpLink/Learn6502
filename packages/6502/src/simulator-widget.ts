import { Memory } from './memory.js';
import { Display } from './display.js';
import { Labels } from './labels.js';
import { Simulator } from './simulator.js';
import { Assembler } from './assembler.js';
import { UI } from './ui.js';

/**
 * Represents the main widget for the 6502 simulator.
 */
export class SimulatorWidget {
  private ui: UI;
  private memory: Memory;
  private display: Display;
  private labels: Labels;
  private simulator: Simulator;
  private assembler: Assembler;

  /**
   * Creates a new SimulatorWidget instance.
   * @param node - The root HTML element for the simulator widget.
   */
  constructor(private node: HTMLElement) {
    this.ui = new UI(node);
    this.memory = new Memory();
    this.display = new Display(node);
    this.labels = new Labels(node);
    this.simulator = new Simulator(node, this.memory, this.display, this.labels, this.ui);
    this.assembler = new Assembler(node, this.memory, this.labels, this.ui);

    this.initialize();
  }

  /**
   * Initializes the simulator widget and sets up event listeners.
   */
  private initialize(): void {
    this.stripText();
    this.ui.initialize();
    this.display.initialize();
    this.simulator.reset();

    this.setupEventListeners();
  }

  /**
   * Sets up event listeners for various UI elements.
   */
  private setupEventListeners(): void {
    this.node.querySelector('.assembleButton')?.addEventListener('click', () => {
      this.simulator.reset();
      this.labels.reset();
      this.assembler.assembleCode();
    });

    this.node.querySelector('.runButton')?.addEventListener('click', () => {
      this.simulator.runBinary();
      this.simulator.stopDebugger();
    });

    this.node.querySelector('.resetButton')?.addEventListener('click', () => {
      this.simulator.reset();
    });

    this.node.querySelector('.hexdumpButton')?.addEventListener('click', () => {
      this.assembler.hexdump();
    });

    this.node.querySelector('.disassembleButton')?.addEventListener('click', () => {
      this.assembler.disassemble();
    });

    this.node.querySelector('.debug')?.addEventListener('change', (e: Event) => {
      const debug = (e.target as HTMLInputElement).checked;
      if (debug) {
        this.ui.debugOn();
        this.simulator.enableDebugger();
      } else {
        this.ui.debugOff();
        this.simulator.stopDebugger();
      }
    });

    this.node.querySelector('.monitoring')?.addEventListener('change', (e: Event) => {
      const state = (e.target as HTMLInputElement).checked;
      this.ui.toggleMonitor(state);
      this.simulator.toggleMonitor(state);
    });

    this.node.querySelector('.start, .length')?.addEventListener('blur', this.simulator.handleMonitorRangeChange.bind(this.simulator));
    this.node.querySelector('.stepButton')?.addEventListener('click', this.simulator.debugExec.bind(this.simulator));
    this.node.querySelector('.gotoButton')?.addEventListener('click', this.simulator.gotoAddr.bind(this.simulator));
    this.node.querySelector('.notesButton')?.addEventListener('click', this.ui.showNotes.bind(this.ui));

    const editor = this.node.querySelector<HTMLTextAreaElement>('.code');
    editor?.addEventListener('keypress', this.simulator.stop);
    editor?.addEventListener('keypress', this.ui.initialize);

    document.addEventListener('keypress', this.memory.storeKeypress);

    this.simulator.handleMonitorRangeChange();
  }

  /**
   * Removes leading and trailing whitespace from the code textarea.
   */
  private stripText(): void {
    const code = this.node.querySelector<HTMLTextAreaElement>('.code');
    if (!code) {
      return;
    }
    let text = code.value;
    text = text.replace(/^\n+/, '').replace(/\s+$/, '');
    code.value = text;
  }
}