import { Memory } from './memory.js';
import { Display } from './display.js';
import { Labels } from './labels.js';
import { UI } from './ui.js';
import { addr2hex, num2hex, message } from './utils.js';

export function Simulator(node: HTMLElement, memory: ReturnType<typeof Memory>, display: ReturnType<typeof Display>, labels: ReturnType<typeof Labels>, ui: ReturnType<typeof UI>) {
  let regA = 0;
  let regX = 0;
  let regY = 0;
  let regP = 0;
  let regPC = 0x600;
  let regSP = 0xff;
  let codeRunning = false;
  let debug = false;
  let monitoring = false;
  let executeId: number | undefined;

  // Set zero and negative processor flags based on result
  function setNVflags(value: number) {
    if (value) {
      regP &= 0xfd;
    } else {
      regP |= 0x02;
    }
    if (value & 0x80) {
      regP |= 0x80;
    } else {
      regP &= 0x7f;
    }
  }

  function setCarryFlagFromBit0(value) {
    regP = (regP & 0xfe) | (value & 1);
  }

  function setCarryFlagFromBit7(value) {
    regP = (regP & 0xfe) | ((value >> 7) & 1);
  }

  function setNVflagsForRegA() {
    setNVflags(regA);
  }

  function setNVflagsForRegX() {
    setNVflags(regX);
  }

  function setNVflagsForRegY() {
    setNVflags(regY);
  }

  const ORA = setNVflagsForRegA;
  const AND = setNVflagsForRegA;
  const EOR = setNVflagsForRegA;
  const ASL = setNVflags;
  const LSR = setNVflags;
  const ROL = setNVflags;
  const ROR = setNVflags;
  const LDA = setNVflagsForRegA;
  const LDX = setNVflagsForRegX;
  const LDY = setNVflagsForRegY;

  function BIT(value: number) {
    if (value & 0x80) {
      regP |= 0x80;
    } else {
      regP &= 0x7f;
    }
    if (value & 0x40) {
      regP |= 0x40;
    } else {
      regP &= ~0x40;
    }
    if (regA & value) {
      regP &= 0xfd;
    } else {
      regP |= 0x02;
    }
  }

  function CLC() {
    regP &= 0xfe;
  }

  function SEC() {
    regP |= 1;
  }


  function CLV() {
    regP &= 0xbf;
  }

  function setOverflow() {
    regP |= 0x40;
  }

  function DEC(addr: number) {
    let value = memory.get(addr);
    value--;
    value &= 0xff;
    memory.storeByte(addr, value, display);
    setNVflags(value);
  }

  function INC(addr: number) {
    let value = memory.get(addr);
    value++;
    value &= 0xff;
    memory.storeByte(addr, value, display);
    setNVflags(value);
  }

  function jumpBranch(offset: number) {
    if (offset > 0x7f) {
      regPC = (regPC - (0x100 - offset));
    } else {
      regPC = (regPC + offset);
    }
  }

  function overflowSet() {
    return regP & 0x40;
  }

  function decimalMode() {
    return regP & 8;
  }

  function carrySet() {
    return regP & 1;
  }

  function negativeSet() {
    return regP & 0x80;
  }

  function zeroSet() {
    return regP & 0x02;
  }

  function doCompare(reg: number, val: number) {
    if (reg >= val) {
      SEC();
    } else {
      CLC();
    }
    val = (reg - val);
    setNVflags(val);
  }

  function testSBC(value: number) {
    let tmp: number, w: number;
    if ((regA ^ value) & 0x80) {
      setOverflow();
    } else {
      CLV();
    }

    if (decimalMode()) {
      tmp = 0xf + (regA & 0xf) - (value & 0xf) + carrySet();
      if (tmp < 0x10) {
        w = 0;
        tmp -= 6;
      } else {
        w = 0x10;
        tmp -= 0x10;
      }
      w += 0xf0 + (regA & 0xf0) - (value & 0xf0);
      if (w < 0x100) {
        CLC();
        if (overflowSet() && w < 0x80) { CLV(); }
        w -= 0x60;
      } else {
        SEC();
        if (overflowSet() && w >= 0x180) { CLV(); }
      }
      w += tmp;
    } else {
      w = 0xff + regA - value + carrySet();
      if (w < 0x100) {
        CLC();
        if (overflowSet() && w < 0x80) { CLV(); }
      } else {
        SEC();
        if (overflowSet() && w >= 0x180) { CLV(); }
      }
    }
    regA = w & 0xff;
    setNVflagsForRegA();
  }

  function testADC(value: number) {
    let tmp: number;
    if ((regA ^ value) & 0x80) {
      CLV();
    } else {
      setOverflow();
    }

    if (decimalMode()) {
      tmp = (regA & 0xf) + (value & 0xf) + carrySet();
      if (tmp >= 10) {
        tmp = 0x10 | ((tmp + 6) & 0xf);
      }
      tmp += (regA & 0xf0) + (value & 0xf0);
      if (tmp >= 160) {
        SEC();
        if (overflowSet() && tmp >= 0x180) { CLV(); }
        tmp += 0x60;
      } else {
        CLC();
        if (overflowSet() && tmp < 0x80) { CLV(); }
      }
    } else {
      tmp = regA + value + carrySet();
      if (tmp >= 0x100) {
        SEC();
        if (overflowSet() && tmp >= 0x180) { CLV(); }
      } else {
        CLC();
        if (overflowSet() && tmp < 0x80) { CLV(); }
      }
    }
    regA = tmp & 0xff;
    setNVflagsForRegA();
  }

  const instructions = {
    i00: function () {
      codeRunning = false;
      //BRK
    },

    i01: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      const value = memory.get(addr);
      regA |= value;
      ORA();
    },

    i05: function () {
      const zp = popByte();
      regA |= memory.get(zp);
      ORA();
    },

    i06: function () {
      const zp = popByte();
      let value = memory.get(zp);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      memory.storeByte(zp, value, display);
      ASL(value);
    },

    i08: function () {
      stackPush(regP | 0x30);
      //PHP
    },

    i09: function () {
      regA |= popByte();
      ORA();
    },

    i0a: function () {
      setCarryFlagFromBit7(regA);
      regA = (regA << 1) & 0xff;
      ASL(regA);
    },

    i0d: function () {
      regA |= memory.get(popWord());
      ORA();
    },

    i0e: function () {
      const addr = popWord();
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      memory.storeByte(addr, value, display);
      ASL(value);
    },

    i10: function () {
      const offset = popByte();
      if (!negativeSet()) { jumpBranch(offset); }
      //BPL
    },

    i11: function () {
      const zp = popByte();
      const value = memory.getWord(zp) + regY;
      regA |= memory.get(value);
      ORA();
    },

    i15: function () {
      const addr = (popByte() + regX) & 0xff;
      regA |= memory.get(addr);
      ORA();
    },

    i16: function () {
      const addr = (popByte() + regX) & 0xff;
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      memory.storeByte(addr, value, display);
      ASL(value);
    },

    i18: function () {
      CLC();
    },

    i19: function () {
      const addr = popWord() + regY;
      regA |= memory.get(addr);
      ORA();
    },

    i1d: function () {
      const addr = popWord() + regX;
      regA |= memory.get(addr);
      ORA();
    },

    i1e: function () {
      const addr = popWord() + regX;
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      memory.storeByte(addr, value, display);
      ASL(value);
    },

    i20: function () {
      const addr = popWord();
      const currAddr = regPC - 1;
      stackPush(((currAddr >> 8) & 0xff));
      stackPush((currAddr & 0xff));
      regPC = addr;
      //JSR
    },

    i21: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      let value = memory.get(addr);
      regA &= value;
      AND();
    },

    i24: function () {
      const zp = popByte();
      const value = memory.get(zp);
      BIT(value);
    },

    i25: function () {
      const zp = popByte();
      regA &= memory.get(zp);
      AND();
    },

    i26: function () {
      const sf = carrySet();
      const addr = popByte();
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      memory.storeByte(addr, value, display);
      ROL(value);
    },

    i28: function () {
      regP = stackPop() | 0x30; // There is no B bit!
      //PLP
    },

    i29: function () {
      regA &= popByte();
      AND();
    },

    i2a: function () {
      const sf = carrySet();
      setCarryFlagFromBit7(regA);
      regA = (regA << 1) & 0xff;
      regA |= sf;
      ROL(regA);
    },

    i2c: function () {
      const value = memory.get(popWord());
      BIT(value);
    },

    i2d: function () {
      const value = memory.get(popWord());
      regA &= value;
      AND();
    },

    i2e: function () {
      const sf = carrySet();
      const addr = popWord();
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      memory.storeByte(addr, value, display);
      ROL(value);
    },

    i30: function () {
      const offset = popByte();
      if (negativeSet()) { jumpBranch(offset); }
      //BMI
    },

    i31: function () {
      const zp = popByte();
      const value = memory.getWord(zp) + regY;
      regA &= memory.get(value);
      AND();
    },

    i35: function () {
      const addr = (popByte() + regX) & 0xff;
      regA &= memory.get(addr);
      AND();
    },

    i36: function () {
      const sf = carrySet();
      const addr = (popByte() + regX) & 0xff;
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      memory.storeByte(addr, value, display);
      ROL(value);
    },

    i38: function () {
      SEC();
    },

    i39: function () {
      const addr = popWord() + regY;
      const value = memory.get(addr);
      regA &= value;
      AND();
    },

    i3d: function () {
      const addr = popWord() + regX;
      const value = memory.get(addr);
      regA &= value;
      AND();
    },

    i3e: function () {
      const sf = carrySet();
      const addr = popWord() + regX;
      let value = memory.get(addr);
      setCarryFlagFromBit7(value);
      value = (value << 1) & 0xff;
      value |= sf;
      memory.storeByte(addr, value, display);
      ROL(value);
    },

    i40: function () {
      regP = stackPop() | 0x30; // There is no B bit!
      regPC = stackPop() | (stackPop() << 8);
      //RTI
    },

    i41: function () {
      const zp = (popByte() + regX) & 0xff;
      const value = memory.getWord(zp);
      regA ^= memory.get(value);
      EOR();
    },

    i45: function () {
      const addr = popByte() & 0xff;
      const value = memory.get(addr);
      regA ^= value;
      EOR();
    },

    i46: function () {
      const addr = popByte() & 0xff;
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      memory.storeByte(addr, value, display);
      LSR(value);
    },

    i48: function () {
      stackPush(regA);
      //PHA
    },

    i49: function () {
      regA ^= popByte();
      EOR();
    },

    i4a: function () {
      setCarryFlagFromBit0(regA);
      regA = regA >> 1;
      LSR(regA);
    },

    i4c: function () {
      regPC = popWord();
      //JMP
    },

    i4d: function () {
      const addr = popWord();
      const value = memory.get(addr);
      regA ^= value;
      EOR();
    },

    i4e: function () {
      const addr = popWord();
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      memory.storeByte(addr, value, display);
      LSR(value);
    },

    i50: function () {
      const offset = popByte();
      if (!overflowSet()) { jumpBranch(offset); }
      //BVC
    },

    i51: function () {
      const zp = popByte();
      const value = memory.getWord(zp) + regY;
      regA ^= memory.get(value);
      EOR();
    },

    i55: function () {
      const addr = (popByte() + regX) & 0xff;
      regA ^= memory.get(addr);
      EOR();
    },

    i56: function () {
      const addr = (popByte() + regX) & 0xff;
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      memory.storeByte(addr, value, display);
      LSR(value);
    },

    i58: function () {
      regP &= ~0x04;
      throw new Error("Interrupts not implemented");
      //CLI
    },

    i59: function () {
      const addr = popWord() + regY;
      const value = memory.get(addr);
      regA ^= value;
      EOR();
    },

    i5d: function () {
      const addr = popWord() + regX;
      const value = memory.get(addr);
      regA ^= value;
      EOR();
    },

    i5e: function () {
      const addr = popWord() + regX;
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      memory.storeByte(addr, value, display);
      LSR(value);
    },

    i60: function () {
      regPC = (stackPop() | (stackPop() << 8)) + 1;
      //RTS
    },

    i61: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      const value = memory.get(addr);
      testADC(value);
      //ADC
    },

    i65: function () {
      const addr = popByte();
      const value = memory.get(addr);
      testADC(value);
      //ADC
    },

    i66: function () {
      const sf = carrySet();
      const addr = popByte();
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      memory.storeByte(addr, value, display);
      ROR(value);
    },

    i68: function () {
      regA = stackPop();
      setNVflagsForRegA();
      //PLA
    },

    i69: function () {
      const value = popByte();
      testADC(value);
      //ADC
    },

    i6a: function () {
      const sf = carrySet();
      setCarryFlagFromBit0(regA);
      regA = regA >> 1;
      if (sf) { regA |= 0x80; }
      ROR(regA);
    },

    i6c: function () {
      regPC = memory.getWord(popWord());
      //JMP
    },

    i6d: function () {
      const addr = popWord();
      const value = memory.get(addr);
      testADC(value);
      //ADC
    },

    i6e: function () {
      const sf = carrySet();
      const addr = popWord();
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      memory.storeByte(addr, value, display);
      ROR(value);
    },

    i70: function () {
      const offset = popByte();
      if (overflowSet()) { jumpBranch(offset); }
      //BVS
    },

    i71: function () {
      const zp = popByte();
      const addr = memory.getWord(zp);
      const value = memory.get(addr + regY);
      testADC(value);
      //ADC
    },

    i75: function () {
      const addr = (popByte() + regX) & 0xff;
      const value = memory.get(addr);
      testADC(value);
      //ADC
    },

    i76: function () {
      const sf = carrySet();
      const addr = (popByte() + regX) & 0xff;
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      memory.storeByte(addr, value, display);
      ROR(value);
    },

    i78: function () {
      regP |= 0x04;
      throw new Error("Interrupts not implemented");
      //SEI
    },

    i79: function () {
      const addr = popWord();
      const value = memory.get(addr + regY);
      testADC(value);
      //ADC
    },

    i7d: function () {
      const addr = popWord();
      const value = memory.get(addr + regX);
      testADC(value);
      //ADC
    },

    i7e: function () {
      const sf = carrySet();
      const addr = popWord() + regX;
      let value = memory.get(addr);
      setCarryFlagFromBit0(value);
      value = value >> 1;
      if (sf) { value |= 0x80; }
      memory.storeByte(addr, value, display);
      ROR(value);
    },

    i81: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      memory.storeByte(addr, regA, display);
      //STA
    },

    i84: function () {
      memory.storeByte(popByte(), regY, display);
      //STY
    },

    i85: function () {
      memory.storeByte(popByte(), regA, display);
      //STA
    },

    i86: function () {
      memory.storeByte(popByte(), regX, display);
      //STX
    },

    i88: function () {
      regY = (regY - 1) & 0xff;
      setNVflagsForRegY();
      //DEY
    },

    i8a: function () {
      regA = regX & 0xff;
      setNVflagsForRegA();
      //TXA
    },

    i8c: function () {
      memory.storeByte(popWord(), regY, display);
      //STY
    },

    i8d: function () {
      memory.storeByte(popWord(), regA, display);
      //STA
    },

    i8e: function () {
      memory.storeByte(popWord(), regX, display);
      //STX
    },

    i90: function () {
      const offset = popByte();
      if (!carrySet()) { jumpBranch(offset); }
      //BCC
    },

    i91: function () {
      const zp = popByte();
      const addr = memory.getWord(zp) + regY;
      memory.storeByte(addr, regA, display);
      //STA
    },

    i94: function () {
      memory.storeByte((popByte() + regX) & 0xff, regY, display);
      //STY
    },

    i95: function () {
      memory.storeByte((popByte() + regX) & 0xff, regA, display);
      //STA
    },

    i96: function () {
      memory.storeByte((popByte() + regY) & 0xff, regX, display);
      //STX
    },

    i98: function () {
      regA = regY & 0xff;
      setNVflagsForRegA();
      //TYA
    },

    i99: function () {
      memory.storeByte(popWord() + regY, regA, display);
      //STA
    },

    i9a: function () {
      regSP = regX & 0xff;
      //TXS
    },

    i9d: function () {
      const addr = popWord();
      memory.storeByte(addr + regX, regA, display);
      //STA
    },

    ia0: function () {
      regY = popByte();
      LDY();
    },

    ia1: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      regA = memory.get(addr);
      LDA();
    },

    ia2: function () {
      regX = popByte();
      LDX();
    },

    ia4: function () {
      regY = memory.get(popByte());
      LDY();
    },

    ia5: function () {
      regA = memory.get(popByte());
      LDA();
    },

    ia6: function () {
      regX = memory.get(popByte());
      LDX();
    },

    ia8: function () {
      regY = regA & 0xff;
      setNVflagsForRegY();
      //TAY
    },

    ia9: function () {
      regA = popByte();
      LDA();
    },

    iaa: function () {
      regX = regA & 0xff;
      setNVflagsForRegX();
      //TAX
    },

    iac: function () {
      regY = memory.get(popWord());
      LDY();
    },

    iad: function () {
      regA = memory.get(popWord());
      LDA();
    },

    iae: function () {
      regX = memory.get(popWord());
      LDX();
    },

    ib0: function () {
      const offset = popByte();
      if (carrySet()) { jumpBranch(offset); }
      //BCS
    },

    ib1: function () {
      const zp = popByte();
      const addr = memory.getWord(zp) + regY;
      regA = memory.get(addr);
      LDA();
    },

    ib4: function () {
      regY = memory.get((popByte() + regX) & 0xff);
      LDY();
    },

    ib5: function () {
      regA = memory.get((popByte() + regX) & 0xff);
      LDA();
    },

    ib6: function () {
      regX = memory.get((popByte() + regY) & 0xff);
      LDX();
    },

    ib8: function () {
      CLV();
    },

    ib9: function () {
      const addr = popWord() + regY;
      regA = memory.get(addr);
      LDA();
    },

    iba: function () {
      regX = regSP & 0xff;
      LDX();
      //TSX
    },

    ibc: function () {
      const addr = popWord() + regX;
      regY = memory.get(addr);
      LDY();
    },

    ibd: function () {
      const addr = popWord() + regX;
      regA = memory.get(addr);
      LDA();
    },

    ibe: function () {
      const addr = popWord() + regY;
      regX = memory.get(addr);
      LDX();
    },

    ic0: function () {
      const value = popByte();
      doCompare(regY, value);
      //CPY
    },

    ic1: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      const value = memory.get(addr);
      doCompare(regA, value);
      //CPA
    },

    ic4: function () {
      const value = memory.get(popByte());
      doCompare(regY, value);
      //CPY
    },

    ic5: function () {
      const value = memory.get(popByte());
      doCompare(regA, value);
      //CPA
    },

    ic6: function () {
      const zp = popByte();
      DEC(zp);
    },

    ic8: function () {
      regY = (regY + 1) & 0xff;
      setNVflagsForRegY();
      //INY
    },

    ic9: function () {
      const value = popByte();
      doCompare(regA, value);
      //CMP
    },

    ica: function () {
      regX = (regX - 1) & 0xff;
      setNVflagsForRegX();
      //DEX
    },

    icc: function () {
      const value = memory.get(popWord());
      doCompare(regY, value);
      //CPY
    },

    icd: function () {
      const value = memory.get(popWord());
      doCompare(regA, value);
      //CPA
    },

    ice: function () {
      const addr = popWord();
      DEC(addr);
    },

    id0: function () {
      const offset = popByte();
      if (!zeroSet()) { jumpBranch(offset); }
      //BNE
    },

    id1: function () {
      const zp = popByte();
      const addr = memory.getWord(zp) + regY;
      const value = memory.get(addr);
      doCompare(regA, value);
      //CMP
    },

    id5: function () {
      const value = memory.get((popByte() + regX) & 0xff);
      doCompare(regA, value);
      //CMP
    },

    id6: function () {
      const addr = (popByte() + regX) & 0xff;
      DEC(addr);
    },

    id8: function () {
      regP &= 0xf7;
      //CLD
    },

    id9: function () {
      const addr = popWord() + regY;
      const value = memory.get(addr);
      doCompare(regA, value);
      //CMP
    },

    idd: function () {
      const addr = popWord() + regX;
      const value = memory.get(addr);
      doCompare(regA, value);
      //CMP
    },

    ide: function () {
      const addr = popWord() + regX;
      DEC(addr);
    },

    ie0: function () {
      const value = popByte();
      doCompare(regX, value);
      //CPX
    },

    ie1: function () {
      const zp = (popByte() + regX) & 0xff;
      const addr = memory.getWord(zp);
      const value = memory.get(addr);
      testSBC(value);
      //SBC
    },

    ie4: function () {
      const value = memory.get(popByte());
      doCompare(regX, value);
      //CPX
    },

    ie5: function () {
      const addr = popByte();
      const value = memory.get(addr);
      testSBC(value);
      //SBC
    },

    ie6: function () {
      const zp = popByte();
      INC(zp);
    },

    ie8: function () {
      regX = (regX + 1) & 0xff;
      setNVflagsForRegX();
      //INX
    },

    ie9: function () {
      const value = popByte();
      testSBC(value);
      //SBC
    },

    iea: function () {
      //NOP
    },

    i42: function () {
      //WDM  -- pseudo op for emulator: arg 0 to output A to message box
      const value = popByte();
      if (value == 0)
        message(node, String.fromCharCode(regA));
    },

    iec: function () {
      const value = memory.get(popWord());
      doCompare(regX, value);
      //CPX
    },

    ied: function () {
      const addr = popWord();
      const value = memory.get(addr);
      testSBC(value);
      //SBC
    },

    iee: function () {
      const addr = popWord();
      INC(addr);
    },

    if0: function () {
      const offset = popByte();
      if (zeroSet()) { jumpBranch(offset); }
      //BEQ
    },

    if1: function () {
      const zp = popByte();
      const addr = memory.getWord(zp);
      const value = memory.get(addr + regY);
      testSBC(value);
      //SBC
    },

    if5: function () {
      const addr = (popByte() + regX) & 0xff;
      const value = memory.get(addr);
      testSBC(value);
      //SBC
    },

    if6: function () {
      const addr = (popByte() + regX) & 0xff;
      INC(addr);
    },

    if8: function () {
      regP |= 8;
      //SED
    },

    if9: function () {
      const addr = popWord();
      const value = memory.get(addr + regY);
      testSBC(value);
      //SBC
    },

    ifd: function () {
      const addr = popWord();
      const value = memory.get(addr + regX);
      testSBC(value);
      //SBC
    },

    ife: function () {
      const addr = popWord() + regX;
      INC(addr);
    },

    ierr: function () {
      message(node, "Address $" + addr2hex(regPC) + " - unknown opcode");
      codeRunning = false;
    }
  };

  function stackPush(value: number) {
    memory.set((regSP & 0xff) + 0x100, value & 0xff);
    regSP--;
    if (regSP < 0) {
      regSP &= 0xff;
      message(node, "6502 Stack filled! Wrapping...");
    }
  }

  function stackPop() {
    let value: number;
    regSP++;
    if (regSP >= 0x100) {
      regSP &= 0xff;
      message(node, "6502 Stack emptied! Wrapping...");
    }
    value = memory.get(regSP + 0x100);
    return value;
  }

  // Pops a byte
  function popByte() {
    return (memory.get(regPC++) & 0xff);
  }

  // Pops a little-endian word
  function popWord() {
    return popByte() + (popByte() << 8);
  }

  // Executes the assembled code
  function runBinary() {
    if (codeRunning) {
      // Switch OFF everything
      stop();
      ui.stop();
    } else {
      ui.play();
      codeRunning = true;
      executeId = setInterval(multiExecute, 15);
    }
  }

  function multiExecute() {
    if (!debug) {
      // use a prime number of iterations to avoid aliasing effects

      for (let w = 0; w < 97; w++) {
        execute();
      }
    }
    updateDebugInfo();
  }


  function executeNextInstruction() {
    let instructionName = popByte().toString(16).toLowerCase();
    if (instructionName.length === 1) {
      instructionName = '0' + instructionName;
    }
    const instruction = instructions['i' + instructionName];

    if (instruction) {
      instruction();
    } else {
      instructions.ierr();
    }
  }

  // Executes one instruction. This is the main part of the CPU simulator.
  function execute(debugging = false) {
    if (!codeRunning && !debugging) { return; }

    setRandomByte();
    executeNextInstruction();

    if ((regPC === 0) || (!codeRunning && !debugging)) {
      stop();
      message(node, "Program end at PC=$" + addr2hex(regPC - 1));
      ui.stop();
    }
  }

  function setRandomByte() {
    memory.set(0xfe, Math.floor(Math.random() * 256));
  }

  function updateMonitor() {
    if (monitoring) {
      const start = parseInt(node.querySelector<HTMLInputElement>('.start')?.value || '0', 16);
      const length = parseInt(node.querySelector<HTMLInputElement>('.length')?.value || '0', 16);

      const end = start + length - 1;

      const monitorNode = node.querySelector<HTMLElement>('.monitor code');

      if (!monitorNode) {
        return;
      }

      if (!isNaN(start) && !isNaN(length) && start >= 0 && length > 0 && end <= 0xffff) {
        monitorNode.innerHTML = memory.format(start, length, memory);
      } else {
        monitorNode.innerHTML = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
      }
    }
  }

  function handleMonitorRangeChange() {

    const $start = node.querySelector<HTMLInputElement>('.start'),
      $length = node.querySelector<HTMLInputElement>('.length'),
      start = parseInt($start?.value || '0', 16),
      length = parseInt($length?.value || '0', 16),
      end = start + length - 1;

    $start?.classList.remove('monitor-invalid');
    $length?.classList.remove('monitor-invalid');

    if (isNaN(start) || start < 0 || start > 0xffff) {

      $start?.classList.add('monitor-invalid');

    } else if (isNaN(length) || end > 0xffff) {

      $length?.classList.add('monitor-invalid');
    }
  }

  // Execute one instruction and print values
  function debugExec() {
    //if (codeRunning) {
    execute(true);
    //}
    updateDebugInfo();
  }

  function updateDebugInfo() {
    let html = "A=$" + num2hex(regA) + " X=$" + num2hex(regX) + " Y=$" + num2hex(regY) + "<br />";
    html += "SP=$" + num2hex(regSP) + " PC=$" + addr2hex(regPC);
    html += "<br />";
    html += "NV-BDIZC<br />";
    for (let i = 7; i >= 0; i--) {
      html += regP >> i & 1;
    }
    const minidebugger = node.querySelector<HTMLElement>('.minidebugger');
    if (minidebugger) {
      minidebugger.innerHTML = html;
    }
    updateMonitor();
  }

  // gotoAddr() - Set PC to address (or address of label)
  function gotoAddr() {
    let inp = prompt("Enter address or label", "");
    let addr = 0;
    if (!inp) {
      return;
    }
    if (labels.find(inp)) {
      addr = labels.getPC(inp);
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
      message(node, "Unable to find/parse given address/label");
    } else {
      regPC = addr;
    }
    updateDebugInfo();
  }


  function stopDebugger() {
    debug = false;
  }

  function enableDebugger() {
    debug = true;
    if (codeRunning) {
      updateDebugInfo();
    }
  }

  // reset() - Reset CPU and memory.
  function reset() {
    display.reset();
    for (let i = 0; i < 0x600; i++) { // clear ZP, stack and screen
      memory.set(i, 0x00);
    }
    regA = regX = regY = 0;
    regPC = 0x600;
    regSP = 0xff;
    regP = 0x30;
    updateDebugInfo();
  }

  function stop() {
    codeRunning = false;
    clearInterval(executeId);
    message(node, "\nStopped\n");
  }

  function toggleMonitor(state: boolean) {
    monitoring = state;
  }

  return {
    runBinary: runBinary,
    enableDebugger: enableDebugger,
    stopDebugger: stopDebugger,
    debugExec: debugExec,
    gotoAddr: gotoAddr,
    reset: reset,
    stop: stop,
    toggleMonitor: toggleMonitor,
    handleMonitorRangeChange: handleMonitorRangeChange
  };
}