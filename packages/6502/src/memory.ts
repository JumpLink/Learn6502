import { num2hex } from './utils.js';
import type { Display } from './display.js';

export function Memory() {
  const memArray = new Array(0x600);

  function set(addr: number, val: number) {
    return memArray[addr] = val;
  }

  function get(addr: number): number {
    return memArray[addr];
  }

  function getWord(addr: number): number {
    return get(addr) + (get(addr + 1) << 8);
  }

  // Poke a byte, don't touch any registers
  function storeByte(this: ReturnType<typeof Memory>, addr: number, value: number, display?: ReturnType<typeof Display>) {
    set(addr, value & 0xff);
    if ((addr >= 0x200) && (addr <= 0x5ff)) {
      if (!display) {
        console.warn('No display found to update the pixel');
        return;
      }
      // TODO: Find a better way to update the display
      display.updatePixel(addr, this);
    }
  }

  // Store keycode in ZP $ff
  // Note: Used in the snake game example to control the snake with wasd keys
  // TODO: Refactor this for a custom controller
  function storeKeypress(this: ReturnType<typeof Memory>, e: KeyboardEvent) {
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
    this.storeByte(0xff, value);
  }

  function format(start: number, length: number, memory: ReturnType<typeof Memory>) {
    let html = '';
    let n: number;

    for (let x = 0; x < length; x++) {
      if ((x & 15) === 0) {
        if (x > 0) { html += "\n"; }
        n = (start + x);
        html += num2hex(((n >> 8) & 0xff));
        html += num2hex((n & 0xff));
        html += ": ";
      }
      html += num2hex(memory.get(start + x));
      html += " ";
    }
    return html;
  }

  return {
    set: set,
    get: get,
    getWord: getWord,
    storeByte: storeByte,
    storeKeypress: storeKeypress,
    format: format
  };
}