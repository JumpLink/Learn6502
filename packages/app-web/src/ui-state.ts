import type { State } from '@easy6502/6502';

/**
 * Manages the user interface for the 6502 emulator.
 */
export class UIState {
  private _currentState: State;

  // Define the various UI states
  private start: State = {
    assemble: true,
    run: [false, 'Run'],
    reset: false,
    hexdump: false,
    disassemble: false,
    debug: [false, false]
  };

  private assembled: State = {
    assemble: false,
    run: [true, 'Run'],
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  };

  private running: State = {
    assemble: false,
    run: [true, 'Stop'],
    reset: true,
    hexdump: false,
    disassemble: false,
    debug: [true, false]
  };

  private debugging: State = {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, true]
  };

  private postDebugging: State = {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  };

  /**
   * Creates a new UI instance.
   * @param node - The root HTML element containing the UI components.
   */
  constructor(private node: HTMLElement) {
    this._currentState = this.start;
  }

  /**
   * Initializes the UI to its starting state.
   */
  public initialize(): void {
    this.setState(this.start);
  }

  /**
   * Sets the UI to the running state.
   */
  public play(): void {
    this.setState(this.running);
  }

  /**
   * Sets the UI to the assembled state (stopped).
   */
  public stop(): void {
    this.setState(this.assembled);
  }

  /**
   * Enables debugging mode in the UI.
   */
  public debugOn(): void {
    this.setState(this.debugging);
  }

  /**
   * Disables debugging mode in the UI.
   */
  public debugOff(): void {
    this.setState(this.postDebugging);
  }

  /**
   * Sets the UI to the assembled state after successful assembly.
   */
  public assembleSuccess(): void {
    this.setState(this.assembled);
  }

  /**
   * Toggles the visibility of the monitor.
   * @param enable - Whether to show or hide the monitor.
   */
  public toggleMonitor(enable: boolean): void {
    const monitor = this.node.querySelector<HTMLElement>('.monitor');
    if (!monitor) {
      return;
    }
    monitor.style.display = enable ? 'block' : 'none';
  }

  /**
   * Displays notes in the messages area.
   */
  public showNotes(): void {
    const messagesCode = this.node.querySelector('.messages code');
    const notes = this.node.querySelector('.notes');
    if (messagesCode && notes) {
      messagesCode.innerHTML = notes.innerHTML;
    }
  }

  public get currentState(): State {
    return this._currentState;
  }

  /**
   * Updates the UI elements based on the current state.
   * @param state - The new state to apply to the UI.
   */
  private setState(state: State): void {
    const assembleButton = this.node.querySelector<HTMLInputElement>('.assembleButton');
    const runButton = this.node.querySelector<HTMLInputElement>('.runButton');
    const resetButton = this.node.querySelector<HTMLInputElement>('.resetButton');
    const hexdumpButton = this.node.querySelector<HTMLInputElement>('.hexdumpButton');
    const disassembleButton = this.node.querySelector<HTMLInputElement>('.disassembleButton');
    const debug = this.node.querySelector<HTMLInputElement>('.debug');
    const stepButton = this.node.querySelector<HTMLInputElement>('.stepButton');
    const gotoButton = this.node.querySelector<HTMLInputElement>('.gotoButton');

    if (assembleButton) {
      assembleButton.disabled = !state.assemble;
    }

    if (state.run) {
      if (runButton) {
        runButton.disabled = !state.run[0];
        runButton.value = state.run[1];
      }
    }

    if (resetButton) {
      resetButton.disabled = !state.reset;
    }

    if (hexdumpButton) {
      hexdumpButton.disabled = !state.hexdump;
    }

    if (disassembleButton) {
      disassembleButton.disabled = !state.disassemble;
    }

    if (debug) {
      debug.disabled = !state.debug[0];
      debug.checked = state.debug[1];
    }

    if (stepButton) {
      stepButton.disabled = !state.debug[1];
    }

    if (gotoButton) {
      gotoButton.disabled = !state.debug[1];
    }

    this._currentState = state;
  }
}