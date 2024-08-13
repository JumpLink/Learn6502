import type { State } from './types/index.js';

export function UI(node: HTMLElement) {
  let currentState: State;

  const start: State = {
    assemble: true,
    run: [false, 'Run'],
    reset: false,
    hexdump: false,
    disassemble: false,
    debug: [false, false]
  };
  const assembled: State = {
    assemble: false,
    run: [true, 'Run'],
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  };
  const running: State = {
    assemble: false,
    run: [true, 'Stop'],
    reset: true,
    hexdump: false,
    disassemble: false,
    debug: [true, false]
  };
  const debugging: State = {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, true]
  };
  const postDebugging: State = {
    assemble: false,
    reset: true,
    hexdump: true,
    disassemble: true,
    debug: [true, false]
  };


  function setState(state: State) {
    const assembleButton = node.querySelector<HTMLInputElement>('.assembleButton');
    const runButton = node.querySelector<HTMLInputElement>('.runButton');
    const resetButton = node.querySelector<HTMLInputElement>('.resetButton');
    const hexdumpButton = node.querySelector<HTMLInputElement>('.hexdumpButton');
    const disassembleButton = node.querySelector<HTMLInputElement>('.disassembleButton');
    const debug = node.querySelector<HTMLInputElement>('.debug');
    const stepButton = node.querySelector<HTMLInputElement>('.stepButton');
    const gotoButton = node.querySelector<HTMLInputElement>('.gotoButton');

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

    currentState = state;
  }

  function initialize() {
    setState(start);
  }

  function play() {
    setState(running);
  }

  function stop() {
    setState(assembled);
  }

  function debugOn() {
    setState(debugging);
  }

  function debugOff() {
    setState(postDebugging);
  }

  function assembleSuccess() {
    setState(assembled);
  }

  function toggleMonitor(enable: boolean) {
    const monitor = node.querySelector<HTMLElement>('.monitor');
    if (!monitor) {
      return;
    }
    if (enable) {
      monitor.style.display = 'block';
    } else {
      monitor.style.display = 'none';
    }
  }

  function showNotes() {
    const messagesCode = node.querySelector('.messages code');
    const notes = node.querySelector('.notes');
    if (messagesCode && notes) {
      messagesCode.innerHTML = notes.innerHTML;
    }
  }

  return {
    initialize: initialize,
    play: play,
    stop: stop,
    assembleSuccess: assembleSuccess,
    debugOn: debugOn,
    debugOff: debugOff,
    toggleMonitor: toggleMonitor,
    showNotes: showNotes,
  };
}