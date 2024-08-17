import { Memory } from './memory.js';
import { Display } from './display.js';
import { Labels } from './labels.js';
import { UI } from './ui.js';
import { MessageConsole } from './message-console.js';
import { EventDispatcher } from './event-dispatcher.js';

import type { SimulatorEvent } from './types/index.js';
import { addr2hex } from './utils.js';

/**
 * 6502 Simulator
 * 
 * This is a simulator for the 6502 processor.
 */
export class Simulator {

  private regA = 0;
  private regX = 0;
  private regY = 0;
  private regP = 0;
  private regPC = 0x600;
  private regSP = 0xff;
  private _codeRunning = false;
  /** If true, the simulator will execute one instruction step by step triggered by the debugger. */
  private stepper = false;
  
  private executeId: number | undefined;

  private readonly events = new EventDispatcher<SimulatorEvent>();

  constructor(private readonly console: MessageConsole, private readonly memory: Memory, private readonly display: Display, private readonly labels: Labels, private readonly ui: UI) {

  }

  public on(event: 'step' | 'reset' | 'stop' | 'goto' | 'multistep', listener: (event?: SimulatorEvent) => void): void {
    this.events.on(event, listener);
  }

  public off(event: 'step' | 'reset' | 'stop' | 'goto' | 'multistep', listener: (event?: SimulatorEvent) => void): void {
    this.events.off(event, listener);
  }

  public once(event: 'step' | 'reset' | 'stop' | 'goto' | 'multistep', listener: () => void): void {
    this.events.once(event, listener);
  }

  public get codeRunning() {
    return this._codeRunning;
  }

  public get info() {
    return {
      regA: this.regA,
      regX: this.regX,
      regY: this.regY,
      regP: this.regP,
      regPC: this.regPC,
      regSP: this.regSP,
    };
  }

  public get stepperEnabled() {
    return this.stepper;
  }

  /**
   * Stop the debugger.
   */
  public stopStepper() {
    this.stepper = false;
  }

  /**
   * Enable the debugger.
   */
  public enableStepper() {
    this.stepper = true;
    if (this.codeRunning) {
      // this.updateDebugInfo();
    }
  }

  /**
   * Execute one instruction and print values.
   */
  public debugExecStep() {
    this.execute(true);
  }


  /**
   * Set PC to address (or address of label).
   */
  public gotoAddr() {
    let inp = prompt("Enter address or label", "");
    let addr = 0;
    if (!inp) {
      return;
    }
    if (this.labels.find(inp)) {
      addr = this.labels.getPC(inp);
    } else {
      if (inp.match(/^0x[0-9a-f]{1,4}$/i)) {
        inp = inp.replace(/^0x/, "");
        addr = parseInt(inp, 16);
      } else if (inp.match(/^\$[0-9a-f]{1,4}$/i)) {
        inp = inp.replace(/^\$/, "");
        addr = parseInt(inp, 16);
      }
    }
    if (addr === 0) {
      this.console.log("Unable to find/parse given address/label");
    } else {
      this.regPC = addr;
    }
    this.dispatchGotoEvent();
  }

  /**
   * Reset CPU and memory.
   */
  public reset() {
    this.display.reset();
    for (let i = 0; i < 0x600; i++) { // clear ZP, stack and screen
      this.memory.set(i, 0x00);
    }
    this.regA = this.regX = this.regY = 0;
    this.regPC = 0x600;
    this.regSP = 0xff;
    this.regP = 0x30;
    this.dispatchResetEvent();
  }

  /**
   * Stop the CPU simulator.
   */
  public stop() {
    this._codeRunning = false;
    clearInterval(this.executeId);
    this.dispatchStopEvent();
    this.console.log("\nStopped\n");
  }

  private dispatchStepEvent() {
    this.events.dispatch('step', { simulator: this });
  }

  private dispatchMultiStepEvent() {
    this.events.dispatch('multistep', { simulator: this });
  }

  private dispatchResetEvent() {
    this.events.dispatch('reset', { simulator: this });
  }

  private dispatchStopEvent() {
    this.events.dispatch('stop', { simulator: this });
  }

  private dispatchGotoEvent() {
    this.events.dispatch('goto', { simulator: this });
  }

  /**
   * Set zero and negative processor flags based on result.
   */
  private setNVflags(value: number) {
    if (value) {
      this.regP &= 0xfd;
    } else {
      this.regP |= 0x02;
    }
    if (value & 0x80) {
      this.regP |= 0x80;
    } else {
      this.regP &= 0x7f;
    }
  }

  /**
   * Sets the carry flag based on bit 0 of the given value.
   * This is used in operations like LSR (Logical Shift Right).
   * @param value - The value to extract the carry flag from.
   */
  private setCarryFlagFromBit0(value: number) {
    this.regP = (this.regP & 0xfe) | (value & 1);
  }

  /**
   * Sets the carry flag based on bit 7 of the given value.
   * This is used in operations like ASL (Arithmetic Shift Left).
   * @param value - The value to extract the carry flag from.
   */
  private setCarryFlagFromBit7(value) {
    this.regP = (this.regP & 0xfe) | ((value >> 7) & 1);
  }

  /**
   * Sets the **N**egative and O**v**erflow flags based on the current value in the A register.
   * This is called after operations that modify the A register.
   */
  private setNVflagsForRegA() {
    this.setNVflags(this.regA);
  }

  /**
   * Sets the **N**egative and O**v**erflow flags based on the current value in the X register.
   * This is called after operations that modify the X register.
   */
  private setNVflagsForRegX() {
    this.setNVflags(this.regX);
  }

  /**
   * Sets the **N**egative and O**v**erflow flags based on the current value in the Y register.
   * This is called after operations that modify the Y register.
   */
  private setNVflagsForRegY() {
    this.setNVflags(this.regY);
  }
  /**
   * ORA - "OR" Memory with Accumulator
   * The ORA instruction performs a bitwise OR operation between the accumulator and a value from memory.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private ORA = this.setNVflagsForRegA;

  /**
   * AND - "AND" Memory with Accumulator
   * The AND instruction performs a bitwise AND operation between the accumulator and a value from memory.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private AND = this.setNVflagsForRegA;

  /**
   * EOR - "Exclusive OR" Memory with Accumulator
   * The EOR instruction performs a bitwise XOR operation between the accumulator and a value from memory.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private EOR = this.setNVflagsForRegA;

  /**
   * ASL - Arithmetic Shift Left
   * The ASL instruction shifts all bits left one position. 0 is shifted into bit 0 and the original bit 7 is shifted into the Carry.
   * It affects the Negative (N), Zero (Z), and Carry (C) flags.
   */
  private ASL = this.setNVflags;

  /**
   * LSR - Logical Shift Right
   * The LSR instruction shifts all bits right one position. 0 is shifted into bit 7 and the original bit 0 is shifted into the Carry.
   * It affects the Negative (N), Zero (Z), and Carry (C) flags.
   */
  private LSR = this.setNVflags;

  /**
   * ROL - Rotate Left
   * The ROL instruction shifts all bits left one position. The Carry is shifted into bit 0 and the original bit 7 is shifted into the Carry.
   * It affects the Negative (N), Zero (Z), and Carry (C) flags.
   */
  private ROL = this.setNVflags;

  /**
   * ROR - Rotate Right
   * The ROR instruction shifts all bits right one position. The Carry is shifted into bit 7 and the original bit 0 is shifted into the Carry.
   * It affects the Negative (N), Zero (Z), and Carry (C) flags.
   */
  private ROR = this.setNVflags;

  /**
   * LDA - Load Accumulator
   * The LDA instruction loads a byte of memory into the accumulator setting the zero and negative flags as appropriate.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private LDA = this.setNVflagsForRegA;

  /**
   * LDX - Load X Register
   * The LDX instruction loads a byte of memory into the X register setting the zero and negative flags as appropriate.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private LDX = this.setNVflagsForRegX;

  /**
   * LDY - Load Y Register
   * The LDY instruction loads a byte of memory into the Y register setting the zero and negative flags as appropriate.
   * It affects the Negative (N) and Zero (Z) flags.
   */
  private LDY = this.setNVflagsForRegY;

  /**
   * Implements the BIT (Bit Test) instruction.
   * This instruction performs a bitwise AND between the accumulator (A) and the specified value,
   * but does not store the result. It affects the following flags:
   * - Negative (N) flag: Set to bit 7 of the value.
   * - Overflow (V) flag: Set to bit 6 of the value.
   * - Zero (Z) flag: Set if the result of A AND value is zero.
   * 
   * @param value - The value to test against the accumulator.
   */
  private BIT(value: number) {
    if (value & 0x80) {
      this.regP |= 0x80;
    } else {
      this.regP &= 0x7f;
    }
    if (value & 0x40) {
      this.regP |= 0x40;
    } else {
      this.regP &= ~0x40;
    }
    if (this.regA & value) {
      this.regP &= 0xfd;
    } else {
      this.regP |= 0x02;
    }
  }

  /**
   * Clear Carry Flag
   * Sets the carry flag to 0
   */
  private CLC() {
    this.regP &= 0xfe; // AND with 1111 1110 to clear the least significant bit (carry flag)
  }

  /**
   * Set Carry Flag
   * Sets the carry flag to 1
   */
  private SEC() {
    this.regP |= 1; // OR with 0000 0001 to set the least significant bit (carry flag)
  }

  /**
   * Clear Overflow Flag
   * Sets the overflow flag to 0
   */
  private CLV() {
    this.regP &= 0xbf; // AND with 1011 1111 to clear the 6th bit (overflow flag)
  }

  private setOverflow() {
    this.regP |= 0x40;
  }

  private DEC(addr: number) {
    let value = this.memory.get(addr);
    value--;
    value &= 0xff;
    this.memory.storeByte(addr, value);
    this.setNVflags(value);
  }

  private INC(addr: number) {
    let value = this.memory.get(addr);
    value++;
    value &= 0xff;
    this.memory.storeByte(addr, value);
    this.setNVflags(value);
  }

  private jumpBranch(offset: number) {
    if (offset > 0x7f) {
      this.regPC = (this.regPC - (0x100 - offset));
    } else {
      this.regPC = (this.regPC + offset);
    }
  }

  private overflowSet() {
    return this.regP & 0x40;
  }

  private decimalMode() {
    return this.regP & 8;
  }

  private carrySet() {
    return this.regP & 1;
  }

  private negativeSet() {
    return this.regP & 0x80;
  }

  private zeroSet() {
    return this.regP & 0x02;
  }

  private doCompare(reg: number, val: number) {
    if (reg >= val) {
      this.SEC();
    } else {
      this.CLC();
    }
    val = (reg - val);
    this.setNVflags(val);
  }

  private testSBC(value: number) {
    let tmp: number, w: number;
    if ((this.regA ^ value) & 0x80) {
      this.setOverflow();
    } else {
      this.CLV();
    }

    if (this.decimalMode()) {
      tmp = 0xf + (this.regA & 0xf) - (value & 0xf) + this.carrySet();
      if (tmp < 0x10) {
        w = 0;
        tmp -= 6;
      } else {
        w = 0x10;
        tmp -= 0x10;
      }
      w += 0xf0 + (this.regA & 0xf0) - (value & 0xf0);
      if (w < 0x100) {
        this.CLC();
        if (this.overflowSet() && w < 0x80) { this.CLV(); }
        w -= 0x60;
      } else {
        this.SEC();
        if (this.overflowSet() && w >= 0x180) { this.CLV(); }
      }
      w += tmp;
    } else {
      w = 0xff + this.regA - value + this.carrySet();
      if (w < 0x100) {
        this.CLC();
        if (this.overflowSet() && w < 0x80) { this.CLV(); }
      } else {
        this.SEC();
        if (this.overflowSet() && w >= 0x180) { this.CLV(); }
      }
    }
    this.regA = w & 0xff;
    this.setNVflagsForRegA();
  }

  private testADC(value: number) {
    let tmp: number;
    if ((this.regA ^ value) & 0x80) {
      this.CLV();
    } else {
      this.setOverflow();
    }

    if (this.decimalMode()) {
      tmp = (this.regA & 0xf) + (value & 0xf) + this.carrySet();
      if (tmp >= 10) {
        tmp = 0x10 | ((tmp + 6) & 0xf);
      }
      tmp += (this.regA & 0xf0) + (value & 0xf0);
      if (tmp >= 160) {
        this.SEC();
        if (this.overflowSet() && tmp >= 0x180) { this.CLV(); }
        tmp += 0x60;
      } else {
        this.CLC();
        if (this.overflowSet() && tmp < 0x80) { this.CLV(); }
      }
    } else {
      tmp = this.regA + value + this.carrySet();
      if (tmp >= 0x100) {
        this.SEC();
        if (this.overflowSet() && tmp >= 0x180) { this.CLV(); }
      } else {
        this.CLC();
        if (this.overflowSet() && tmp < 0x80) { this.CLV(); }
      }
    }
    this.regA = tmp & 0xff;
    this.setNVflagsForRegA();
  }

  private instructions = {
    i00: () => {
      this._codeRunning = false;
      //BRK
    },

    i01: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr);
      this.regA |= value;
      this.ORA();
    },

    i05: () => {
      const zp = this.popByte();
      this.regA |= this.memory.get(zp);
      this.ORA();
    },

    i06: () => {
      const zp = this.popByte();
      let value = this.memory.get(zp);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      this.memory.storeByte(zp, value);
      this.ASL(value);
    },

    i08: () => {
      this.stackPush(this.regP | 0x30);
      //PHP
    },

    i09: () => {
      this.regA |= this.popByte();
      this.ORA();
    },

    i0a: () => {
      this.setCarryFlagFromBit7(this.regA);
      this.regA = (this.regA << 1) & 0xff;
      this.ASL(this.regA);
    },

    i0d: () => {
      this.regA |= this.memory.get(this.popWord());
      this.ORA();
    },

    i0e: () => {
      const addr = this.popWord();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      this.memory.storeByte(addr, value);
      this.ASL(value);
    },

    i10: () => {
      const offset = this.popByte();
      if (!this.negativeSet()) { this.jumpBranch(offset); }
      //BPL
    },

    i11: () => {
      const zp = this.popByte();
      const value = this.memory.getWord(zp) + this.regY;
      this.regA |= this.memory.get(value);
      this.ORA();
    },

    i15: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      this.regA |= this.memory.get(addr);
      this.ORA();
    },

    i16: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      this.memory.storeByte(addr, value);
      this.ASL(value);
    },

    i18: () => {
      this.CLC();
    },

    i19: () => {
      const addr = this.popWord() + this.regY;
      this.regA |= this.memory.get(addr);
      this.ORA();
    },

    i1d: () => {
      const addr = this.popWord() + this.regX;
      this.regA |= this.memory.get(addr);
      this.ORA();
    },

    i1e: () => {
      const addr = this.popWord() + this.regX;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      this.memory.storeByte(addr, value);
      this.ASL(value);
    },

    i20: () => {
      const addr = this.popWord();
      const currAddr = this.regPC - 1;
      this.stackPush(((currAddr >> 8) & 0xff));
      this.stackPush((currAddr & 0xff));
      this.regPC = addr;
      //JSR
    },

    i21: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      let value = this.memory.get(addr);
      this.regA &= value;
      this.AND();
    },

    i24: () => {
      const zp = this.popByte();
      const value = this.memory.get(zp);
      this.BIT(value);
    },

    i25: () => {
      const zp = this.popByte();
      this.regA &= this.memory.get(zp);
      this.AND();
    },

    i26: () => {
      const sf = this.carrySet();
      const addr = this.popByte();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      this.memory.storeByte(addr, value);
      this.ROL(value);
    },

    i28: () => {
      this.regP = this.stackPop() | 0x30; // There is no B bit!
      //PLP
    },

    i29: () => {
      this.regA &= this.popByte();
      this.AND();
    },

    i2a: () => {
      const sf = this.carrySet();
      this.setCarryFlagFromBit7(this.regA);
      this.regA = (this.regA << 1) & 0xff;
      this.regA |= sf;
      this.ROL(this.regA);
    },

    i2c: () => {
      const value = this.memory.get(this.popWord());
      this.BIT(value);
    },

    i2d: () => {
      const value = this.memory.get(this.popWord());
      this.regA &= value;
      this.AND();
    },

    i2e: () => {
      const sf = this.carrySet();
      const addr = this.popWord();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      this.memory.storeByte(addr, value);
      this.ROL(value);
    },

    i30: () => {
      const offset = this.popByte();
      if (this.negativeSet()) { this.jumpBranch(offset); }
      //BMI
    },

    i31: () => {
      const zp = this.popByte();
      const value = this.memory.getWord(zp) + this.regY;
      this.regA &= this.memory.get(value);
      this.AND();
    },

    i35: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      this.regA &= this.memory.get(addr);
      this.AND();
    },

    i36: () => {
      const sf = this.carrySet();
      const addr = (this.popByte() + this.regX) & 0xff;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      this.memory.storeByte(addr, value);
      this.ROL(value);
    },

    i38: () => {
      this.SEC();
    },

    i39: () => {
      const addr = this.popWord() + this.regY;
      const value = this.memory.get(addr);
      this.regA &= value;
      this.AND();
    },

    i3d: () => {
      const addr = this.popWord() + this.regX;
      const value = this.memory.get(addr);
      this.regA &= value;
      this.AND();
    },

    i3e: () => {
      const sf = this.carrySet();
      const addr = this.popWord() + this.regX;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      this.memory.storeByte(addr, value);
      this.ROL(value);
    },

    i40: () => {
      this.regP = this.stackPop() | 0x30; // There is no B bit!
      this.regPC = this.stackPop() | (this.stackPop() << 8);
      //RTI
    },

    i41: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const value = this.memory.getWord(zp);
      this.regA ^= this.memory.get(value);
      this.EOR();
    },

    i45: () => {
      const addr = this.popByte() & 0xff;
      const value = this.memory.get(addr);
      this.regA ^= value;
      this.EOR();
    },

    i46: () => {
      const addr = this.popByte() & 0xff;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      this.memory.storeByte(addr, value);
      this.LSR(value);
    },

    i48: () => {
      this.stackPush(this.regA);
      //PHA
    },

    i49: () => {
      this.regA ^= this.popByte();
      this.EOR();
    },

    i4a: () => {
      this.setCarryFlagFromBit0(this.regA);
      this.regA = this.regA >> 1;
      this.LSR(this.regA);
    },

    i4c: () => {
      this.regPC = this.popWord();
      //JMP
    },

    i4d: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr);
      this.regA ^= value;
      this.EOR();
    },

    i4e: () => {
      const addr = this.popWord();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      this.memory.storeByte(addr, value);
      this.LSR(value);
    },

    i50: () => {
      const offset = this.popByte();
      if (!this.overflowSet()) { this.jumpBranch(offset); }
      //BVC
    },

    i51: () => {
      const zp = this.popByte();
      const value = this.memory.getWord(zp) + this.regY;
      this.regA ^= this.memory.get(value);
      this.EOR();
    },

    i55: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      this.regA ^= this.memory.get(addr);
      this.EOR();
    },

    i56: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      this.memory.storeByte(addr, value);
      this.LSR(value);
    },

    i58: () => {
      this.regP &= ~0x04;
      throw new Error("Interrupts not implemented");
      //CLI
    },

    i59: () => {
      const addr = this.popWord() + this.regY;
      const value = this.memory.get(addr);
      this.regA ^= value;
      this.EOR();
    },

    i5d: () => {
      const addr = this.popWord() + this.regX;
      const value = this.memory.get(addr);
      this.regA ^= value;
      this.EOR();
    },

    i5e: () => {
      const addr = this.popWord() + this.regX;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      this.memory.storeByte(addr, value);
      this.LSR(value);
    },

    i60: () => {
      this.regPC = (this.stackPop() | (this.stackPop() << 8)) + 1;
      //RTS
    },

    i61: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr);
      this.testADC(value);
      //ADC
    },

    i65: () => {
      const addr = this.popByte();
      const value = this.memory.get(addr);
      this.testADC(value);
      //ADC
    },

    i66: () => {
      const sf = this.carrySet();
      const addr = this.popByte();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      this.memory.storeByte(addr, value);
      this.ROR(value);
    },

    i68: () => {
      this.regA = this.stackPop();
      this.setNVflagsForRegA();
      //PLA
    },

    i69: () => {
      const value = this.popByte();
      this.testADC(value);
      //ADC
    },

    i6a: () => {
      const sf = this.carrySet();
      this.setCarryFlagFromBit0(this.regA);
      this.regA = this.regA >> 1;
      if (sf) { this.regA |= 0x80; }
      this.ROR(this.regA);
    },

    i6c: () => {
      this.regPC = this.memory.getWord(this.popWord());
      //JMP
    },

    i6d: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr);
      this.testADC(value);
      //ADC
    },

    i6e: () => {
      const sf = this.carrySet();
      const addr = this.popWord();
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      this.memory.storeByte(addr, value);
      this.ROR(value);
    },

    i70: () => {
      const offset = this.popByte();
      if (this.overflowSet()) { this.jumpBranch(offset); }
      //BVS
    },

    i71: () => {
      const zp = this.popByte();
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr + this.regY);
      this.testADC(value);
      //ADC
    },

    i75: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      const value = this.memory.get(addr);
      this.testADC(value);
      //ADC
    },

    i76: () => {
      const sf = this.carrySet();
      const addr = (this.popByte() + this.regX) & 0xff;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      this.memory.storeByte(addr, value);
      this.ROR(value);
    },

    i78: () => {
      this.regP |= 0x04;
      throw new Error("Interrupts not implemented");
      //SEI
    },

    i79: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr + this.regY);
      this.testADC(value);
      //ADC
    },

    i7d: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr + this.regX);
      this.testADC(value);
      //ADC
    },

    i7e: () => {
      const sf = this.carrySet();
      const addr = this.popWord() + this.regX;
      let value = this.memory.get(addr);
      this.setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      this.memory.storeByte(addr, value);
      this.ROR(value);
    },

    i81: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      this.memory.storeByte(addr, this.regA);
      //STA
    },

    i84: () => {
      this.memory.storeByte(this.popByte(), this.regY);
      //STY
    },

    i85: () => {
      this.memory.storeByte(this.popByte(), this.regA);
      //STA
    },

    i86: () => {
      this.memory.storeByte(this.popByte(), this.regX);
      //STX
    },

    i88: () => {
      this.regY = (this.regY - 1) & 0xff;
      this.setNVflagsForRegY();
      //DEY
    },

    i8a: () => {
      this.regA = this.regX & 0xff;
      this.setNVflagsForRegA();
      //TXA
    },

    i8c: () => {
      this.memory.storeByte(this.popWord(), this.regY);
      //STY
    },

    i8d: () => {
      this.memory.storeByte(this.popWord(), this.regA);
      //STA
    },

    i8e: () => {
      this.memory.storeByte(this.popWord(), this.regX);
      //STX
    },

    i90: () => {
      const offset = this.popByte();
      if (!this.carrySet()) { this.jumpBranch(offset); }
      //BCC
    },

    i91: () => {
      const zp = this.popByte();
      const addr = this.memory.getWord(zp) + this.regY;
      this.memory.storeByte(addr, this.regA);
      //STA
    },

    i94: () => {
      this.memory.storeByte((this.popByte() + this.regX) & 0xff, this.regY);
      //STY
    },

    i95: () => {
      this.memory.storeByte((this.popByte() + this.regX) & 0xff, this.regA);
      //STA
    },

    i96: () => {
      this.memory.storeByte((this.popByte() + this.regY) & 0xff, this.regX);
      //STX
    },

    i98: () => {
      this.regA = this.regY & 0xff;
      this.setNVflagsForRegA();
      //TYA
    },

    i99: () => {
      this.memory.storeByte(this.popWord() + this.regY, this.regA);
      //STA
    },

    i9a: () => {
      this.regSP = this.regX & 0xff;
      //TXS
    },

    i9d: () => {
      const addr = this.popWord();
      this.memory.storeByte(addr + this.regX, this.regA);
      //STA
    },

    ia0: () => {
      this.regY = this.popByte();
      this.LDY();
    },

    ia1: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      this.regA = this.memory.get(addr);
      this.LDA();
    },

    ia2: () => {
      this.regX = this.popByte();
      this.LDX();
    },

    ia4: () => {
      this.regY = this.memory.get(this.popByte());
      this.LDY();
    },

    ia5: () => {
      this.regA = this.memory.get(this.popByte());
      this.LDA();
    },

    ia6: () => {
      this.regX = this.memory.get(this.popByte());
      this.LDX();
    },

    ia8: () => {
      this.regY = this.regA & 0xff;
      this.setNVflagsForRegY();
      //TAY
    },

    ia9: () => {
      this.regA = this.popByte();
      this.LDA();
    },

    iaa: () => {
      this.regX = this.regA & 0xff;
      this.setNVflagsForRegX();
      //TAX
    },

    iac: () => {
      this.regY = this.memory.get(this.popWord());
      this.LDY();
    },

    iad: () => {
      this.regA = this.memory.get(this.popWord());
      this.LDA();
    },

    iae: () => {
      this.regX = this.memory.get(this.popWord());
      this.LDX();
    },

    ib0: () => {
      const offset = this.popByte();
      if (this.carrySet()) { this.jumpBranch(offset); }
      //BCS
    },

    ib1: () => {
      const zp = this.popByte();
      const addr = this.memory.getWord(zp) + this.regY;
      this.regA = this.memory.get(addr);
      this.LDA();
    },

    ib4: () => {
      this.regY = this.memory.get((this.popByte() + this.regX) & 0xff);
      this.LDY();
    },

    ib5: () => {
      this.regA = this.memory.get((this.popByte() + this.regX) & 0xff);
      this.LDA();
    },

    ib6: () => {
      this.regX = this.memory.get((this.popByte() + this.regY) & 0xff);
      this.LDX();
    },

    ib8: () => {
      this.CLV();
    },

    ib9: () => {
      const addr = this.popWord() + this.regY;
      this.regA = this.memory.get(addr);
      this.LDA();
    },

    iba: () => {
      this.regX = this.regSP & 0xff;
      this.LDX();
      //TSX
    },

    ibc: () => {
      const addr = this.popWord() + this.regX;
      this.regY = this.memory.get(addr);
      this.LDY();
    },

    ibd: () => {
      const addr = this.popWord() + this.regX;
      this.regA = this.memory.get(addr);
      this.LDA();
    },

    ibe: () => {
      const addr = this.popWord() + this.regY;
      this.regX = this.memory.get(addr);
      this.LDX();
    },

    ic0: () => {
      const value = this.popByte();
      this.doCompare(this.regY, value);
      //CPY
    },

    ic1: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //CPA
    },

    ic4: () => {
      const value = this.memory.get(this.popByte());
      this.doCompare(this.regY, value);
      //CPY
    },

    ic5: () => {
      const value = this.memory.get(this.popByte());
      this.doCompare(this.regA, value);
      //CPA
    },

    ic6: () => {
      const zp = this.popByte();
      this.DEC(zp);
    },

    ic8: () => {
      this.regY = (this.regY + 1) & 0xff;
      this.setNVflagsForRegY();
      //INY
    },

    ic9: () => {
      const value = this.popByte();
      this.doCompare(this.regA, value);
      //CMP
    },

    ica: () => {
      this.regX = (this.regX - 1) & 0xff;
      this.setNVflagsForRegX();
      //DEX
    },

    icc: () => {
      const value = this.memory.get(this.popWord());
      this.doCompare(this.regY, value);
      //CPY
    },

    icd: () => {
      const value = this.memory.get(this.popWord());
      this.doCompare(this.regA, value);
      //CPA
    },

    ice: () => {
      const addr = this.popWord();
      this.DEC(addr);
    },

    id0: () => {
      const offset = this.popByte();
      if (!this.zeroSet()) { this.jumpBranch(offset); }
      //BNE
    },

    id1: () => {
      const zp = this.popByte();
      const addr = this.memory.getWord(zp) + this.regY;
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //CMP
    },

    id5: () => {
      const value = this.memory.get((this.popByte() + this.regX) & 0xff);
      this.doCompare(this.regA, value);
      //CMP
    },

    id6: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      this.DEC(addr);
    },

    id8: () => {
      this.regP &= 0xf7;
      //CLD
    },

    id9: () => {
      const addr = this.popWord() + this.regY;
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //CMP
    },

    idd: () => {
      const addr = this.popWord() + this.regX;
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //CMP
    },

    ide: () => {
      const addr = this.popWord() + this.regX;
      this.DEC(addr);
    },

    ie0: () => {
      const value = this.popByte();
      this.doCompare(this.regX, value);
      //CPX
    },

    ie1: () => {
      const zp = (this.popByte() + this.regX) & 0xff;
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //SBC
    },

    ie4: () => {
      const value = this.memory.get(this.popByte());
      this.doCompare(this.regX, value);
      //CPX
    },

    ie5: () => {
      const addr = this.popByte();
      const value = this.memory.get(addr);
      this.doCompare(this.regA, value);
      //SBC
    },

    ie6: () => {
      const zp = this.popByte();
      this.INC(zp);
    },

    ie8: () => {
      this.regX = (this.regX + 1) & 0xff;
      this.setNVflagsForRegX();
      //INX
    },

    ie9: () => {
      const value = this.popByte();
      this.testSBC(value);
      //SBC
    },

    iea: () => {
      //NOP
    },

    i42: () => {
      //WDM  -- pseudo op for emulator: arg 0 to output A to message box
      const value = this.popByte();
      if (value == 0)
        this.console.log(String.fromCharCode(this.regA));
    },

    iec: () => {
      const value = this.memory.get(this.popWord());
      this.doCompare(this.regX, value);
      //CPX
    },

    ied: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr);
      this.testSBC(value);
      //SBC
    },

    iee: () => {
      const addr = this.popWord();
      this.INC(addr);
    },

    if0: () => {
      const offset = this.popByte();
      if (this.zeroSet()) { this.jumpBranch(offset); }
      //BEQ
    },

    if1: () => {
      const zp = this.popByte();
      const addr = this.memory.getWord(zp);
      const value = this.memory.get(addr + this.regY);
      this.testSBC(value);
      //SBC
    },

    if5: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      const value = this.memory.get(addr);
      this.testSBC(value);
      //SBC
    },

    if6: () => {
      const addr = (this.popByte() + this.regX) & 0xff;
      this.INC(addr);
    },

    if8: () => {
      this.regP |= 8;
      //SED
    },

    if9: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr + this.regY);
      this.testSBC(value);
      //SBC
    },

    ifd: () => {
      const addr = this.popWord();
      const value = this.memory.get(addr + this.regX);
      this.testSBC(value);
      //SBC
    },

    ife: () => {
      const addr = this.popWord() + this.regX;
      this.INC(addr);
    },

    ierr: () => {
      this.console.log("Address $" + addr2hex(this.regPC) + " - unknown opcode");
      this._codeRunning = false;
    }
  };

  private stackPush(value: number) {
    this.memory.set((this.regSP & 0xff) + 0x100, value & 0xff);
    this.regSP--;
    if (this.regSP < 0) {
      this.regSP &= 0xff;
      this.console.log("6502 Stack filled! Wrapping...");
    }
  }

  private stackPop() {
    let value: number;
    this.regSP++;
    if (this.regSP >= 0x100) {
      this.regSP &= 0xff;
      this.console.log("6502 Stack emptied! Wrapping...");
    }
    value = this.memory.get(this.regSP + 0x100);
    return value;
  }

  /**
   * Pops a byte.
   */
  private popByte() {
    return (this.memory.get(this.regPC++) & 0xff);
  }

  /**
   * Pops a little-endian word.
   */
  private popWord() {
    return this.popByte() + (this.popByte() << 8);
  }

  /**
   * Executes the assembled code.
   */
  public runBinary() {
    if (this._codeRunning) {
      // Switch OFF everything
      this.stop();
      this.ui.stop();
    } else {
      this.ui.play();
      this._codeRunning = true;
      this.executeId = setInterval(this.multiExecute.bind(this), 15);
    }
  }

  private multiExecute() {
    // If stepper is enabled, do not execute the code automatically
    if (this.stepper) {
      return;
    }

    // use a prime number of iterations to avoid aliasing effects
    for (let w = 0; w < 97; w++) {
      this.execute();
    }
  
    this.dispatchMultiStepEvent();
  }


  private executeNextInstruction() {
    let instructionName = this.popByte().toString(16).toLowerCase();
    if (instructionName.length === 1) {
      instructionName = '0' + instructionName;
    }
    const instruction = this.instructions['i' + instructionName];

    if (instruction) {
      instruction();
    } else {
      this.instructions.ierr();
    }
  }

  /**
   * Executes one instruction. This is the main part of the CPU simulator.
   */
  private execute(debugging = false) {
    if (!this._codeRunning && !debugging) { return; }

    this.setRandomByte();
    this.executeNextInstruction();
    this.dispatchStepEvent();

    if ((this.regPC === 0) || (!this._codeRunning && !debugging)) {
      this.stop();
      this.console.log("Program end at PC=$" + addr2hex(this.regPC - 1));
      this.ui.stop();
    }
  }

  private setRandomByte() {
    this.memory.set(0xfe, Math.floor(Math.random() * 256));
  }
}