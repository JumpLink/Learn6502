import { Memory, Labels, Simulator, Assembler, AssemblerEvent, SimulatorEvent, MessageConsole } from '@easy6502/6502';
import { Debugger } from './debugger.js';
import { Display } from './display.js';
import { UI } from './ui.js';
import { WebMessageConsole } from './web-message-console.js';

/**
 * Represents the main widget for the 6502 simulator.
 */
export class SimulatorWidget {
  private console: MessageConsole;
  private ui: UI;
  private memory: Memory;
  private display: Display;
  private labels: Labels;
  private simulator: Simulator;
  private assembler: Assembler;
  private debugger: Debugger;

  /**
   * Creates a new SimulatorWidget instance.
   * @param node - The root HTML element for the simulator widget.
   */
  constructor(private node: HTMLElement) {

    this.console = new WebMessageConsole(node.querySelector('.messages code')!);
    this.ui = new UI(node);
    this.memory = new Memory();
    this.display = new Display(node, this.memory);
    this.labels = new Labels(this.console);
    this.simulator = new Simulator(this.console, this.memory, this.labels);
    this.assembler = new Assembler(this.console, this.memory, this.labels);
    this.debugger = new Debugger(node, this.simulator, this.memory, {
      monitor: {
        start: 0x00,
        length: 0xff,
      },
    });
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
      this.assembler.assembleCode(this.node.querySelector<HTMLTextAreaElement>('.code')?.value || "");
    });

    this.node.querySelector('.runButton')?.addEventListener('click', () => {
      this.simulator.stopStepper();
      this.simulator.runBinary();
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
        this.simulator.enableStepper();
      } else {
        this.ui.debugOff();
        this.simulator.stopStepper();
      }
    });

    this.node.querySelector('.monitoring')?.addEventListener('change', (e: Event) => {
      const state = (e.target as HTMLInputElement).checked;
      this.ui.toggleMonitor(state);
      this.debugger.toggleMonitor(state);
    });

    this.node.querySelector('.start, .length')?.addEventListener('blur', this.debugger.onMonitorRangeChange.bind(this.debugger));
    this.node.querySelector('.stepButton')?.addEventListener('click', this.simulator.debugExecStep.bind(this.simulator));
    this.node.querySelector('.gotoButton')?.addEventListener('click', this.simulator.gotoAddr.bind(this.simulator));
    this.node.querySelector('.notesButton')?.addEventListener('click', this.ui.showNotes.bind(this.ui));

    const editor = this.node.querySelector<HTMLTextAreaElement>('.code');
    editor?.addEventListener('keypress', () => {
      this.simulator.stop();
    });
    editor?.addEventListener('keypress', this.ui.initialize.bind(this.ui));

    document.addEventListener('keypress', (e: KeyboardEvent) => {

      let value = 0;

      switch (e.key) {
        case 'w':
          value = 119;
          break;
        case 'a':
          value = 97;
          break;
        case 's':
          value = 115;
          break;
        case 'd':
          value = 100;
          break;
        default:
          value = e.which;
      }

      this.memory.storeKeypress(value);
    });

    this.assembler.on('assemble-success', (event: AssemblerEvent) => {
      this.ui.assembleSuccess();
      this.memory.set(this.assembler.getCurrentPC(), 0x00); // Set a null byte at the end of the code

      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.assembler.on('assemble-failure', (event: AssemblerEvent) => {
      this.ui.initialize();
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.assembler.on('hexdump', (event: AssemblerEvent) => {
      this.openPopup(event.message || '', 'Hexdump');
    });

    this.assembler.on('disassembly', (event: AssemblerEvent) => {
      this.openPopup(event.message || '', 'Disassembly');
    });

    this.simulator.on('stop', (event: SimulatorEvent) => {
      this.ui.stop();
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.simulator.on('start', (event: SimulatorEvent) => {
      this.ui.play();
      if(event.message) {
        this.console.log(event.message);
      }
    });

    this.simulator.on('reset', (event: SimulatorEvent) => {
      this.display.reset();
    });

    this.debugger.onMonitorRangeChange();
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

  /**
   * Opens a popup window with the given content.
   * @param content - The content to display in the popup.
   * @param title - The title of the popup window.
   */
  private openPopup(content: string, title: string) {
    const w = window.open('', title, 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no');

    if (!w) {
      this.console.error('Failed to open popup');
      return;
    }

    let html = "<html><head>";
    html += "<link href='dist/assets/main.css' rel='stylesheet' type='text/css' />";
    html += "<title>" + title + "</title></head><body>";
    html += "<pre><code>";

    html += content;

    html += "</code></pre></body></html>";
    w.document.write(html);
    w.document.close();
  }
}