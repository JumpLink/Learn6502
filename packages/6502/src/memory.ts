import { num2hex } from './utils.js';
import { EventDispatcher } from './event-dispatcher.js';

import type { MemoryEvent } from './types/index.js';

/**
 * Represents the memory of the 6502 emulator.
 * @emits changed - Emitted when a memory location is changed.
 */
export class Memory {
  private memArray: number[];

  private readonly events = new EventDispatcher<MemoryEvent>();

  /**
   * Creates a new Memory instance.
   */
  constructor() {
    this.memArray = new Array(0x600);

    this.storeKeypress = this.storeKeypress.bind(this);
  }

  public on(event: 'changed', listener: (event: MemoryEvent) => void): void {
    this.events.on(event, listener);
  }

  public off(event: 'changed', listener: (event: MemoryEvent) => void): void {
    this.events.off(event, listener);
  }

  public once(event: 'changed', listener: (event: MemoryEvent) => void): void {
    this.events.once(event, listener);
  }

  /**
   * Sets a value at a specific memory address.
   * @param addr - The memory address.
   * @param val - The value to set.
   */
  public set(addr: number, val: number): void {
    this.memArray[addr] = val;
    this.events.dispatch('changed', { addr, val });
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
   */
  public storeByte(addr: number, value: number): void {
    // Ensure the value is a valid byte (0-255) by masking with 0xff
    this.set(addr, value & 0xff);
  }

  /**
   * Stores a keypress in memory.
   * Note: Used in the snake game example to control the snake with w-a-s-d keys.
   * @param value - The value to store.
   */
  public storeKeypress(value: number): void {
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