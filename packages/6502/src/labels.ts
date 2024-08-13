import { message } from './utils.js';

import type { Symbols } from './types/index.js';
import type { Assembler } from './assembler.js';

/**
 * Manages labels for the 6502 assembler.
 * 
 * This function creates an object that handles label indexing, lookup, and management
 * for assembly code. It provides methods to:
 * - Index labels from assembly code lines
 * - Find existing labels
 * - Get and set program counter (PC) values for labels
 * - Display messages about found labels
 * 
 * @param {HTMLElement} node - The HTML element where messages will be displayed
 * @returns An object with methods for label management
 */
export function Labels(node: HTMLElement) {
    let labelIndex: string[] = [];

    function indexLines(lines: string[], symbols: Symbols, assembler: ReturnType<typeof Assembler>) {
      for (let i = 0; i < lines.length; i++) {
        if (!indexLine(lines[i], symbols, assembler)) {
          message(node, "**Label already defined at line " + (i + 1) + ":** " + lines[i]);
          return false;
        }
      }
      return true;
    }

    // Extract label if line contains one and calculate position in memory.
    // Return false if label already exists.
    function indexLine(input: string, symbols: Symbols, assembler: ReturnType<typeof Assembler>) {
          
      // Figure out how many bytes this instruction takes
      const currentPC = assembler.getCurrentPC();
      assembler.assembleLine(input, 0, symbols); //TODO: find a better way for Labels to have access to assembler

      // Find command or label
      if (input.match(/^\w+:/)) {
        const label = input.replace(/(^\w+):.*$/, "$1");
        
        if (symbols.lookup(label)) {
          message(node, "**Label " + label + "is already used as a symbol; please rename one of them**");
          return false;
        }
        
        return push(label + "|" + currentPC);
      }
      return true;
    }

    // Push label to array. Return false if label already exists.
    function push(name: string) {
      if (find(name)) {
        return false;
      }
      labelIndex.push(name + "|");
      return true;
    }

    // Returns true if label exists.
    function find(name: string) {
      let nameAndAddr: string[];
      for (let i = 0; i < labelIndex.length; i++) {
        nameAndAddr = labelIndex[i].split("|");
        if (name === nameAndAddr[0]) {
          return true;
        }
      }
      return false;
    }

    // Associates label with address
    function setPC(name: string, addr: number) {
      let nameAndAddr: string[];
      for (let i = 0; i < labelIndex.length; i++) {
        nameAndAddr = labelIndex[i].split("|");
        if (name === nameAndAddr[0]) {
          labelIndex[i] = name + "|" + addr;
          return true;
        }
      }
      return false;
    }

    // Get address associated with label
    function getPC(name: string): number {
      let nameAndAddr: string[];
      for (let i = 0; i < labelIndex.length; i++) {
        nameAndAddr = labelIndex[i].split("|");
        if (name === nameAndAddr[0]) {
          return Number(nameAndAddr[1]);
        }
      }
      return -1;
    }

    function displayMessage() {
      let str = "Found " + labelIndex.length + " label";
      if (labelIndex.length !== 1) {
        str += "s";
      }
      message(node, str + ".");
    }

    function reset() {
      labelIndex = [];
    }

    return {
      indexLines: indexLines,
      find: find,
      getPC: getPC,
      displayMessage: displayMessage,
      reset: reset
    };
  }