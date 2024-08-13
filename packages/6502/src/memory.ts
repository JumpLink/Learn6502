import { num2hex } from './utils.js';
import type { Display } from './display.js';

/**
 * Represents the memory of the 6502 emulator.
 */
export class Memory {
  private memArray: number[];

  /**
   * Creates a new Memory instance.
   */
  constructor() {
    this.memArray = new Array(0x600);

    this.storeKeypress = this.storeKeypress.bind(this);
  }

  /**
   * Sets a value at a specific memory address.
   * @param addr - The memory address.
   * @param val - The value to set.
   */
  public set(addr: number, val: number): void {
    this.memArray[addr] = val;
  }

  /**
   * Gets the value at a specific memory address.
   * @param addr - The memory address.
   * @returns The value at the specified address.
   */
  public get(addr: number): number {
    return this.memArray[addr];
  }

  /**
   * Gets a 16-bit word from memory.
   * @param addr - The starting memory address.
   * @returns The 16-bit word value.
   */
  public getWord(addr: number): number {
    return this.get(addr) + (this.get(addr + 1) << 8);
  }

  /**
   * Stores a byte in memory and updates the display if necessary.
   * @param addr - The memory address.
   * @param value - The value to store.
   * @param display - Optional Display instance for pixel updates.
   */
  public storeByte(addr: number, value: number, display?: Display): void {
    this.set(addr, value & 0xff);
    if ((addr >= 0x200) && (addr <= 0x5ff)) {
      if (!display) {
        console.warn('No display found to update the pixel');
        return;
      }
      // TODO: Find a better way to update the display
      display.updatePixel(addr, this);
    }
  }

  /**
   * Stores a keypress in memory.
   * Note: Used in the snake game example to control the snake with wasd keys.
   * TODO: Refactor this for a custom controller.
   * @param e - The keyboard event.
   */
  public storeKeypress(e: KeyboardEvent): void {
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

  /**
   * Formats a section of memory for display.
   * @param start - The starting memory address.
   * @param length - The number of bytes to format.
   * @returns A formatted string representation of the memory section.
   */
  public format(start: number, length: number): string {
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
      html += num2hex(this.get(start + x));
      html += " ";
    }
    return html;
  }
}