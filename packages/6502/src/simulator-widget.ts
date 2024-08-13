/*
 *  6502 assembler and simulator in Javascript
 *  (C)2006-2010 Stian Soreng - www.6502asm.com
 *
 *  Adapted by Nick Morgan
 *  https://github.com/skilldrick/6502js
 * 
 *  Adapted by Pascal Garber
 *  https://github.com/JumpLink/easy6502
 *
 *  Released under the GNU General Public License
 *  see http://gnu.org/licenses/gpl.html
 */

'use strict';

import { Memory } from './memory.js';
import { Display } from './display.js';
import { Labels } from './labels.js';
import { Simulator } from './simulator.js';
import { Assembler } from './assembler.js';
import { UI } from './ui.js';

export function SimulatorWidget(node: HTMLElement) {

  const ui = UI(node);
  const memory = Memory();
  const display = Display(node);
  const labels = Labels(node);
  const simulator = Simulator(node, memory, display, labels, ui);
  const assembler = Assembler(node, memory, labels, ui);

  function initialize() {
    stripText();
    ui.initialize();
    display.initialize();
    simulator.reset();

    node.querySelector('.assembleButton')?.addEventListener('click', () => {
      simulator.reset();
      labels.reset();
      assembler.assembleCode();
    });
    node.querySelector('.runButton')?.addEventListener('click', () => {
      simulator.runBinary();
    });
    node.querySelector('.runButton')?.addEventListener('click', () => {
      simulator.stopDebugger();
    });
    node.querySelector('.resetButton')?.addEventListener('click', () => {
      simulator.reset();
    });
    node.querySelector('.hexdumpButton')?.addEventListener('click', () => {
      assembler.hexdump();
    });
    node.querySelector('.disassembleButton')?.addEventListener('click', () => {
      assembler.disassemble();
    });
    node.querySelector('.debug')?.addEventListener('change', (e: Event) => {
      const debug = (e.target as HTMLInputElement).checked;
      if (debug) {
        ui.debugOn();
        simulator.enableDebugger();
      } else {
        ui.debugOff();
        simulator.stopDebugger();
      }
    });
    node.querySelector('.monitoring')?.addEventListener('change', (e: Event) => {
      const state = (e.target as HTMLInputElement).checked;
      ui.toggleMonitor(state);
      simulator.toggleMonitor(state);
    });
    node.querySelector('.start, .length')?.addEventListener('blur', simulator.handleMonitorRangeChange);
    node.querySelector('.stepButton')?.addEventListener('click', simulator.debugExec);
    node.querySelector('.gotoButton')?.addEventListener('click', simulator.gotoAddr);
    node.querySelector('.notesButton')?.addEventListener('click', ui.showNotes);

    const editor = node.querySelector<HTMLTextAreaElement>('.code');

    editor?.addEventListener('keypress input', simulator.stop);
    editor?.addEventListener('keypress input', ui.initialize);
    // Beditor?.addEventListener('keydown', ui.captureTabInEditor);

    document.addEventListener('keypress', memory.storeKeypress.bind(memory));

    simulator.handleMonitorRangeChange();
  }

  function stripText() {
    const code = node.querySelector<HTMLTextAreaElement>('.code');
    if (!code) {
      return;
    }
    //Remove leading and trailing space in textarea
    let text = code.value;
    text = text.replace(/^\n+/, '').replace(/\s+$/, '');
    code.value = text;
  }

  initialize();
}

