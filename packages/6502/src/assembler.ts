/*
 *  6502 assembler and simulator in Javascript
 *  (C)2006-2010 Stian Soreng - www.6502asm.com
 *
 *  Adapted by Nick Morgan
 *  https://github.com/skilldrick/6502js
 * 
 *  Ported runtime independent to TypeScript by Pascal Garber
 *  https://github.com/JumpLink/easy6502
 *
 *  Released under the GNU General Public License
 *  see http://gnu.org/licenses/gpl.html
 */

'use strict';

interface Symbols {
  lookup(name: string): string | undefined;
}

interface State {
  assemble: boolean;
  run?: [boolean, string];
  reset: boolean;
  hexdump: boolean;
  disassemble: boolean;
  debug: [boolean, boolean];
}

export function SimulatorWidget(node: HTMLElement) {

  const ui = UI();
  const display = Display();
  const memory = Memory();
  const labels = Labels();
  const simulator = Simulator();
  const assembler = Assembler();

  function initialize() {
    stripText();
    ui.initialize();
    display.initialize();
    simulator.reset();

    node.querySelector('.assembleButton')?.addEventListener('click', () => {
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
    editor?.addEventListener('keydown', ui.captureTabInEditor);

    document.addEventListener('keypress', memory.storeKeypress);

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

  function UI() {
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

    function toggleMonitor (enable: boolean) {
      const monitor = node.querySelector<HTMLElement>('.monitor');
      if(!monitor) {
        return;
      }
      if(enable) {
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

    function captureTabInEditor(e: KeyboardEvent) {
      // Tab Key
      if(e.key === 'Tab' || e.keyCode === 9) {

        // Prevent focus loss
        e.preventDefault();

        // Insert tab at caret position (instead of losing focus)
        const caretStart = this.selectionStart,
            caretEnd   = this.selectionEnd,
            currentValue = this.value;

        this.value = currentValue.substring(0, caretStart) + "\t" + currentValue.substring(caretEnd);

        // Move cursor forwards one (after tab)
        this.selectionStart = this.selectionEnd = caretStart + 1;
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
      captureTabInEditor: captureTabInEditor
    };
  }


  function Display() {
    const palette = [
      "#000000", "#ffffff", "#880000", "#aaffee",
      "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
      "#dd8855", "#664400", "#ff7777", "#333333",
      "#777777", "#aaff66", "#0088ff", "#bbbbbb"
    ];
    let ctx: CanvasRenderingContext2D | null = null;
    let width: number;
    let height: number;
    let pixelSize: number;
    let numX = 32;
    let numY = 32;

    function initialize() {
      const canvas = node.querySelector<HTMLCanvasElement>('.screen');
      if (!canvas) {
        throw new Error('Canvas not found');
      }
      width = canvas.width || 160;
      height = canvas.height || 160;
      pixelSize = width / numX;
      ctx = canvas.getContext('2d');
      reset();
    }

    function reset() {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, width, height);
    }

    function updatePixel(addr: number) {
      ctx.fillStyle = palette[memory.get(addr) & 0x0f];
      const y = Math.floor((addr - 0x200) / 32);
      const x = (addr - 0x200) % 32;
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }

    return {
      initialize: initialize,
      reset: reset,
      updatePixel: updatePixel
    };
  }

  function Memory() {
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
    function storeByte(addr: number, value: number) {
      set(addr, value & 0xff);
      if ((addr >= 0x200) && (addr <= 0x5ff)) {
        display.updatePixel(addr);
      }
    }

    // Store keycode in ZP $ff
    function storeKeypress(e: KeyboardEvent) {
      const value = e.which;
      memory.storeByte(0xff, value);
    }

    function format(start: number, length: number) {
      let html = '';
      let n;

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

  function Simulator() {
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
      memory.storeByte(addr, value);
      setNVflags(value);
    }

    function INC(addr: number) {
      let value = memory.get(addr);
      value++;
      value &= 0xff;
      memory.storeByte(addr, value);
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
        memory.storeByte(zp, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
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
        memory.storeByte(addr, value);
        ROR(value);
      },

      i81: function () {
        const zp = (popByte() + regX) & 0xff;
        const addr = memory.getWord(zp);
        memory.storeByte(addr, regA);
        //STA
      },

      i84: function () {
        memory.storeByte(popByte(), regY);
        //STY
      },

      i85: function () {
        memory.storeByte(popByte(), regA);
        //STA
      },

      i86: function () {
        memory.storeByte(popByte(), regX);
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
        memory.storeByte(popWord(), regY);
        //STY
      },

      i8d: function () {
        memory.storeByte(popWord(), regA);
        //STA
      },

      i8e: function () {
        memory.storeByte(popWord(), regX);
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
        memory.storeByte(addr, regA);
        //STA
      },

      i94: function () {
        memory.storeByte((popByte() + regX) & 0xff, regY);
        //STY
      },

      i95: function () {
        memory.storeByte((popByte() + regX) & 0xff, regA);
        //STA
      },

      i96: function () {
        memory.storeByte((popByte() + regY) & 0xff, regX);
        //STX
      },

      i98: function () {
        regA = regY & 0xff;
        setNVflagsForRegA();
        //TYA
      },

      i99: function () {
        memory.storeByte(popWord() + regY, regA);
        //STA
      },

      i9a: function () {
        regSP = regX & 0xff;
        //TXS
      },

      i9d: function () {
        const addr = popWord();
        memory.storeByte(addr + regX, regA);
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
          message(String.fromCharCode(regA));
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
        message("Address $" + addr2hex(regPC) + " - unknown opcode");
        codeRunning = false;
      }
    };

    function stackPush(value) {
      memory.set((regSP & 0xff) + 0x100, value & 0xff);
      regSP--;
      if (regSP < 0) {
        regSP &= 0xff;
        message("6502 Stack filled! Wrapping...");
      }
    }

    function stackPop() {
      let value;
      regSP++;
      if (regSP >= 0x100) {
        regSP &= 0xff;
        message("6502 Stack emptied! Wrapping...");
      }
      value = memory.get(regSP + 0x100);
      return value;
    }

    // Pops a byte
    function popByte() {
      return(memory.get(regPC++) & 0xff);
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
        message("Program end at PC=$" + addr2hex(regPC - 1));
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
          monitorNode.innerHTML = memory.format(start, length);
        } else {
          monitorNode.innerHTML = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
        }
      }
    }

    function handleMonitorRangeChange() {

      const $start  = node.querySelector<HTMLInputElement>('.start'),
          $length = node.querySelector<HTMLInputElement>('.length'),
          start   = parseInt($start?.value || '0', 16),
          length  = parseInt($length?.value || '0', 16),
          end     = start + length - 1;

      $start?.classList.remove('monitor-invalid');
      $length?.classList.remove('monitor-invalid');

      if(isNaN(start) || start < 0 || start > 0xffff) {

        $start?.classList.add('monitor-invalid');

      } else if(isNaN(length) || end > 0xffff) {

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
      for (let i = 7; i >=0; i--) {
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
        message("Unable to find/parse given address/label");
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
      message("\nStopped\n");
    }

    function toggleMonitor (state) {
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


  function Labels() {
    let labelIndex: string[] = [];

    function indexLines(lines: string[], symbols: Symbols) {
      for (let i = 0; i < lines.length; i++) {
        if (!indexLine(lines[i], symbols)) {
          message("**Label already defined at line " + (i + 1) + ":** " + lines[i]);
          return false;
        }
      }
      return true;
    }

    // Extract label if line contains one and calculate position in memory.
    // Return false if label already exists.
    function indexLine(input: string, symbols: Symbols) {
          
      // Figure out how many bytes this instruction takes
      const currentPC = assembler.getCurrentPC();
      assembler.assembleLine(input, 0, symbols); //TODO: find a better way for Labels to have access to assembler

      // Find command or label
      if (input.match(/^\w+:/)) {
        const label = input.replace(/(^\w+):.*$/, "$1");
        
        if (symbols.lookup(label)) {
          message("**Label " + label + "is already used as a symbol; please rename one of them**");
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
          return Number(nameAndAddr[1]); //TODO: check if this is the right way to convert string to number
        }
      }
      return -1;
    }

    function displayMessage() {
      let str = "Found " + labelIndex.length + " label";
      if (labelIndex.length !== 1) {
        str += "s";
      }
      message(str + ".");
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


  function Assembler() {
    let defaultCodePC: number;
    let codeLen: number;
    let codeAssembledOK = false;
    let wasOutOfRangeBranch = false;

    const Opcodes = [
      /* Name, Imm,  ZP,   ZPX,  ZPY,  ABS, ABSX, ABSY,  IND, INDX, INDY, SNGL, BRA */
      ["ADC", 0x69, 0x65, 0x75, null, 0x6d, 0x7d, 0x79, null, 0x61, 0x71, null, null],
      ["AND", 0x29, 0x25, 0x35, null, 0x2d, 0x3d, 0x39, null, 0x21, 0x31, null, null],
      ["ASL", null, 0x06, 0x16, null, 0x0e, 0x1e, null, null, null, null, 0x0a, null],
      ["BIT", null, 0x24, null, null, 0x2c, null, null, null, null, null, null, null],
      ["BPL", null, null, null, null, null, null, null, null, null, null, null, 0x10],
      ["BMI", null, null, null, null, null, null, null, null, null, null, null, 0x30],
      ["BVC", null, null, null, null, null, null, null, null, null, null, null, 0x50],
      ["BVS", null, null, null, null, null, null, null, null, null, null, null, 0x70],
      ["BCC", null, null, null, null, null, null, null, null, null, null, null, 0x90],
      ["BCS", null, null, null, null, null, null, null, null, null, null, null, 0xb0],
      ["BNE", null, null, null, null, null, null, null, null, null, null, null, 0xd0],
      ["BEQ", null, null, null, null, null, null, null, null, null, null, null, 0xf0],
      ["BRK", null, null, null, null, null, null, null, null, null, null, 0x00, null],
      ["CMP", 0xc9, 0xc5, 0xd5, null, 0xcd, 0xdd, 0xd9, null, 0xc1, 0xd1, null, null],
      ["CPX", 0xe0, 0xe4, null, null, 0xec, null, null, null, null, null, null, null],
      ["CPY", 0xc0, 0xc4, null, null, 0xcc, null, null, null, null, null, null, null],
      ["DEC", null, 0xc6, 0xd6, null, 0xce, 0xde, null, null, null, null, null, null],
      ["EOR", 0x49, 0x45, 0x55, null, 0x4d, 0x5d, 0x59, null, 0x41, 0x51, null, null],
      ["CLC", null, null, null, null, null, null, null, null, null, null, 0x18, null],
      ["SEC", null, null, null, null, null, null, null, null, null, null, 0x38, null],
      ["CLI", null, null, null, null, null, null, null, null, null, null, 0x58, null],
      ["SEI", null, null, null, null, null, null, null, null, null, null, 0x78, null],
      ["CLV", null, null, null, null, null, null, null, null, null, null, 0xb8, null],
      ["CLD", null, null, null, null, null, null, null, null, null, null, 0xd8, null],
      ["SED", null, null, null, null, null, null, null, null, null, null, 0xf8, null],
      ["INC", null, 0xe6, 0xf6, null, 0xee, 0xfe, null, null, null, null, null, null],
      ["JMP", null, null, null, null, 0x4c, null, null, 0x6c, null, null, null, null],
      ["JSR", null, null, null, null, 0x20, null, null, null, null, null, null, null],
      ["LDA", 0xa9, 0xa5, 0xb5, null, 0xad, 0xbd, 0xb9, null, 0xa1, 0xb1, null, null],
      ["LDX", 0xa2, 0xa6, null, 0xb6, 0xae, null, 0xbe, null, null, null, null, null],
      ["LDY", 0xa0, 0xa4, 0xb4, null, 0xac, 0xbc, null, null, null, null, null, null],
      ["LSR", null, 0x46, 0x56, null, 0x4e, 0x5e, null, null, null, null, 0x4a, null],
      ["NOP", null, null, null, null, null, null, null, null, null, null, 0xea, null],
      ["ORA", 0x09, 0x05, 0x15, null, 0x0d, 0x1d, 0x19, null, 0x01, 0x11, null, null],
      ["TAX", null, null, null, null, null, null, null, null, null, null, 0xaa, null],
      ["TXA", null, null, null, null, null, null, null, null, null, null, 0x8a, null],
      ["DEX", null, null, null, null, null, null, null, null, null, null, 0xca, null],
      ["INX", null, null, null, null, null, null, null, null, null, null, 0xe8, null],
      ["TAY", null, null, null, null, null, null, null, null, null, null, 0xa8, null],
      ["TYA", null, null, null, null, null, null, null, null, null, null, 0x98, null],
      ["DEY", null, null, null, null, null, null, null, null, null, null, 0x88, null],
      ["INY", null, null, null, null, null, null, null, null, null, null, 0xc8, null],
      ["ROR", null, 0x66, 0x76, null, 0x6e, 0x7e, null, null, null, null, 0x6a, null],
      ["ROL", null, 0x26, 0x36, null, 0x2e, 0x3e, null, null, null, null, 0x2a, null],
      ["RTI", null, null, null, null, null, null, null, null, null, null, 0x40, null],
      ["RTS", null, null, null, null, null, null, null, null, null, null, 0x60, null],
      ["SBC", 0xe9, 0xe5, 0xf5, null, 0xed, 0xfd, 0xf9, null, 0xe1, 0xf1, null, null],
      ["STA", null, 0x85, 0x95, null, 0x8d, 0x9d, 0x99, null, 0x81, 0x91, null, null],
      ["TXS", null, null, null, null, null, null, null, null, null, null, 0x9a, null],
      ["TSX", null, null, null, null, null, null, null, null, null, null, 0xba, null],
      ["PHA", null, null, null, null, null, null, null, null, null, null, 0x48, null],
      ["PLA", null, null, null, null, null, null, null, null, null, null, 0x68, null],
      ["PHP", null, null, null, null, null, null, null, null, null, null, 0x08, null],
      ["PLP", null, null, null, null, null, null, null, null, null, null, 0x28, null],
      ["STX", null, 0x86, null, 0x96, 0x8e, null, null, null, null, null, null, null],
      ["STY", null, 0x84, 0x94, null, 0x8c, null, null, null, null, null, null, null],
      ["WDM", 0x42, 0x42, null, null, null, null, null, null, null, null, null, null],
      ["---", null, null, null, null, null, null, null, null, null, null, null, null]
    ];
    
    // Assembles the code into memory
    function assembleCode() {
      const BOOTSTRAP_ADDRESS = 0x600;
      const $messagesCode = node.querySelector<HTMLElement>('.messages code')

      if (!$messagesCode) {
        throw new Error("Could not find code element");
      }

      wasOutOfRangeBranch = false;
  
      simulator.reset();
      labels.reset();
      defaultCodePC = BOOTSTRAP_ADDRESS;
      $messagesCode.innerHTML = "";

      let code = node.querySelector<HTMLTextAreaElement>('.code')?.value || "";
      code += "\n\n";
      const lines = code.split("\n");
      codeAssembledOK = true;

      message("Preprocessing ...");
      const symbols = preprocess(lines);

      message("Indexing labels ...");
      defaultCodePC = BOOTSTRAP_ADDRESS;
      if (!labels.indexLines(lines, symbols)) {
        return false;
      }
      labels.displayMessage();

      defaultCodePC = BOOTSTRAP_ADDRESS;
      message("Assembling code ...");
      
      codeLen = 0;
      let i = 0;
      for (i = 0; i < lines.length; i++) {
        if (!assembleLine(lines[i], i, symbols)) {
          codeAssembledOK = false;
          break;
        }
      }

      const lastLine = lines[i];

      if (codeLen === 0) {
        codeAssembledOK = false;
        message("No code to run.");
      }

      if (codeAssembledOK) {
        ui.assembleSuccess();
        memory.set(defaultCodePC, 0x00); //set a null byte at the end of the code
      } else {

        

        if(lastLine) {
          const str = lines[i].replace("<", "&lt;").replace(">", "&gt;");
          if(!wasOutOfRangeBranch) {
            message("**Syntax error line " + (i + 1) + ": " + str + "**");
          } else {
            message('**Out of range branch on line ' + (i + 1) + ' (branches are limited to -128 to +127): ' + str + '**');
          }
        }

        ui.initialize();
        return false;
      }

      message("Code assembled successfully, " + codeLen + " bytes.");
      return true;
    }

    // Sanitize input: remove comments and trim leading/trailing whitespace
    function sanitize(line: string) {
      // remove comments
      const no_comments = line.replace(/^(.*?);.*/, "$1");
  
      // trim line
      return no_comments.replace(/^\s+/, "").replace(/\s+$/, "");
    }

    function preprocess(lines: string[]): Symbols {
      const table: Record<string, string> = {};
      const PREFIX = "__"; // Using a prefix avoids clobbering any predefined properties
      
      function lookup(key: string): string | undefined {
        if (table.hasOwnProperty(PREFIX + key)) return table[PREFIX + key];
        else return undefined;
      }
      
      function add(key: string, value: string) {
        const valueAlreadyExists = table.hasOwnProperty(PREFIX + key)
        if (!valueAlreadyExists) {
          table[PREFIX + key] = value;
        }
      }
        
      // Build the substitution table
      for (let i = 0; i < lines.length; i++) {
        lines[i] = sanitize(lines[i]);
        const match_data = lines[i].match(/^define\s+(\w+)\s+(\S+)/);
        if (match_data) {
          add(match_data[1], sanitize(match_data[2]));
          lines[i] = ""; // We're done with this preprocessor directive, so delete it
        }
      }
      
      // Callers will only need the lookup function
      return {
        lookup: lookup
      }
    }
  
    // Assembles one line of code.
    // Returns true if it assembled successfully, false otherwise.
    function assembleLine(input: string, lineno: number, symbols: Symbols) {
      let label: string | undefined, command: string | undefined, param: string | undefined, addr: number | undefined;

      // Find command or label
      if (input.match(/^\w+:/)) {
        label = input.replace(/(^\w+):.*$/, "$1");
        if (input.match(/^\w+:[\s]*\w+.*$/)) {
          input = input.replace(/^\w+:[\s]*(.*)$/, "$1");
          command = input.replace(/^(\w+).*$/, "$1");
        } else {
          command = "";
        }
      } else {
        command = input.replace(/^(\w+).*$/, "$1");
      }

      // Nothing to do for blank lines
      if (command === "") {
        return true;
      }

      command = command.toUpperCase();

      if (input.match(/^\*\s*=\s*\$?[0-9a-f]*$/)) {
        // equ spotted
        param = input.replace(/^\s*\*\s*=\s*/, "");
        if (param[0] === "$") {
          param = param.replace(/^\$/, "");
          addr = parseInt(param, 16);
        } else {
          addr = parseInt(param, 10);
        }
        if ((addr < 0) || (addr > 0xffff)) {
          message("Unable to relocate code outside 64k memory");
          return false;
        }
        defaultCodePC = addr;
        return true;
      }

      if (input.match(/^\w+\s+.*?$/)) {
        param = input.replace(/^\w+\s+(.*?)/, "$1");
      } else if (input.match(/^\w+$/)) {
        param = "";
      } else {
        return false;
      }

      param = param.replace(/[ ]/g, "");

      if (command === "DCB") {
        return DCB(param);
      }
      for (let o = 0; o < Opcodes.length; o++) {
        if (Opcodes[o][0] === command) {
          if (checkSingle(param, Opcodes[o][11] as number)) { return true; }
          if (checkImmediate(param, Opcodes[o][1] as number, symbols)) { return true; }
          if (checkZeroPage(param, Opcodes[o][2] as number, symbols)) { return true; }
          if (checkZeroPageX(param, Opcodes[o][3] as number, symbols)) { return true; }
          if (checkZeroPageY(param, Opcodes[o][4] as number, symbols)) { return true; }
          if (checkAbsoluteX(param, Opcodes[o][6] as number, symbols)) { return true; }
          if (checkAbsoluteY(param, Opcodes[o][7] as number, symbols)) { return true; }
          if (checkIndirect(param, Opcodes[o][8] as number, symbols)) { return true; }
          if (checkIndirectX(param, Opcodes[o][9] as number, symbols)) { return true; }
          if (checkIndirectY(param, Opcodes[o][10] as number, symbols)) { return true; }
          if (checkAbsolute(param, Opcodes[o][5] as number, symbols)) { return true; }
          if (checkBranch(param, Opcodes[o][12] as number)) { return true; }
        }
      }
      
      return false; // Unknown syntax
    }

    function DCB(param: string) {
      let values: string[];
      let number: number;
      let str: string;
      let ch: string;
      values = param.split(",");
      if (values.length === 0) { return false; }
      for (let v = 0; v < values.length; v++) {
        str = values[v];
        if (str) {
          ch = str.substring(0, 1);
          if (ch === "$") {
            number = parseInt(str.replace(/^\$/, ""), 16);
            pushByte(number);
          } else if (ch ==="%") {
            number = parseInt(str.replace(/^%/, ""), 2)
            pushByte(number)
          } else if (ch >= "0" && ch <= "9") {
            number = parseInt(str, 10);
            pushByte(number);
          } else {
            return false;
          }
        }
      }
      return true;
    }
    
    // Try to parse the given parameter as a byte operand.
    // Returns the (positive) value if successful, otherwise -1
    function tryParseByteOperand(param: string, symbols: Symbols) {
      if (param.match(/^\w+$/)) {
        const lookupVal = symbols.lookup(param); // Substitute symbol by actual value, then proceed
        if (lookupVal) {
          param = lookupVal;
        }
      }
      
      let value: number | undefined;
      let match_data: RegExpMatchArray | null;

      // Is it a decimal operand?
      match_data = param.match(/^([0-9]{1,3})$/);
      if (match_data) {
        value = parseInt(match_data[1], 10);
      }

      // Is it a hexadecimal operand?
      match_data = param.match(/^\$([0-9a-f]{1,2})$/i);
      if (match_data) {
        value = parseInt(match_data[1], 16);
      }

      // Is it a binary operand?
      match_data = param.match(/^%([0-1]{1,8})$/);
      if (match_data) {
        value = parseInt(match_data[1], 2);
      }

      if (value === undefined) {
        return -1;
      }
      
      // Validate range
      if (value >= 0 && value <= 0xff) {
        return value;
      } else {
        return -1;  
      }
    }
    
    // Try to parse the given parameter as a word operand.
    // Returns the (positive) value if successful, otherwise -1
    function tryParseWordOperand(param: string, symbols: Symbols) {
      if (param.match(/^\w+$/)) {
        const lookupVal = symbols.lookup(param); // Substitute symbol by actual value, then proceed
        if (lookupVal) {
          param = lookupVal;
        }
      }
      
      let value: number | undefined;
    
      // Is it a hexadecimal operand?
      const match_data = param.match(/^\$([0-9a-f]{3,4})$/i);
      if (match_data) {
        value = parseInt(match_data[1], 16);
      } else {
        // Is it a decimal operand?
        const match_data = param.match(/^([0-9]{1,5})$/i);
        if (match_data) {
          value = parseInt(match_data[1], 10);
        }
      }

      if (value === undefined) {
        return -1;
      }
      
      // Validate range
      if (value >= 0 && value <= 0xffff) {
        return value;
      } else {
        return -1;
      }
    }

    // Common branch function for all branches (BCC, BCS, BEQ, BNE..)
    function checkBranch(param: string, opcode: number) {
      let addr: number;
      if (opcode === null) { return false; }

      addr = -1;
      if (param.match(/\w+/)) {
        addr = labels.getPC(param);
      }
      if (addr === -1) { pushWord(0x00); return false; }
      pushByte(opcode);

      const distance = addr - defaultCodePC - 1;

      if(distance < -128 || distance > 127) {
          wasOutOfRangeBranch = true;
          return false;
      }

      pushByte(distance);
      return true;
    }

    // Check if param is immediate and push value
    function checkImmediate(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      let label: string;
      let hilo: string;
      let addr: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^#([\w\$%]+)$/i);
      if (match_data) {
        const operand = tryParseByteOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushByte(operand);
          return true;
        }
      }
      
      // Label lo/hi
      if (param.match(/^#[<>]\w+$/)) {
        label = param.replace(/^#[<>](\w+)$/, "$1");
        hilo = param.replace(/^#([<>]).*$/, "$1");
        pushByte(opcode);
        if (labels.find(label)) {
          addr = labels.getPC(label);
          switch(hilo) {
          case ">":
            pushByte((addr >> 8) & 0xff);
            return true;
          case "<":
            pushByte(addr & 0xff);
            return true;
          default:
            return false;
          }
        } else {
          pushByte(0x00);
          return true;
        }
      }
      
      return false;
    }

    // Check if param is indirect and push value
    function checkIndirect(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^\(([\w\$]+)\)$/i);
      if (match_data) {
        const operand = tryParseWordOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushWord(operand);
          return true;
        }
      }
      return false;
    }

    // Check if param is indirect X and push value
    function checkIndirectX(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^\(([\w\$]+),X\)$/i);
      if (match_data) {
        const operand = tryParseByteOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushByte(operand);
          return true;
        }
      }
      return false;
    }

    // Check if param is indirect Y and push value
    function checkIndirectY(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^\(([\w\$]+)\),Y$/i);
      if (match_data) {
        const operand = tryParseByteOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushByte(operand);
          return true;
        }
      }
      return false;
    }

    // Check single-byte opcodes
    function checkSingle(param: string, opcode: number) {
      if (opcode === null) { return false; }
      // Accumulator instructions are counted as single-byte opcodes
      if (param !== "" && param !== "A") { return false; }
      pushByte(opcode);
      return true;
    }

    // Check if param is ZP and push value
    function checkZeroPage(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      if (opcode === null) { return false; }

      const operand = tryParseByteOperand(param, symbols);
      if (operand >= 0) {
        pushByte(opcode);
        pushByte(operand);
        return true;
      }
      
      return false;
    }

    // Check if param is ABSX and push value
    function checkAbsoluteX(param: string, opcode: number, symbols: Symbols) {
      let number: number;
      let value: number;
      let addr: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^([\w\$]+),X$/i);
      if (match_data) {
        const operand = tryParseWordOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushWord(operand);
          return true;
        }
      }

      // it could be a label too..
      if (param.match(/^\w+,X$/i)) {
        param = param.replace(/,X$/i, "");
        pushByte(opcode);
        if (labels.find(param)) {
          addr = labels.getPC(param);
          if (addr < 0 || addr > 0xffff) { return false; }
          pushWord(addr);
          return true;
        } else {
          pushWord(0xffff); // filler, only used while indexing labels
          return true;
        }
      }

      return false;
    }

    // Check if param is ABSY and push value
    function checkAbsoluteY(param: string, opcode: number, symbols: Symbols) {
      let number: number;
      let value: number;
      let addr: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^([\w\$]+),Y$/i);
      if (match_data) {
        const operand = tryParseWordOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushWord(operand);
          return true;
        }
      }

      // it could be a label too..
      if (param.match(/^\w+,Y$/i)) {
        param = param.replace(/,Y$/i, "");
        pushByte(opcode);
        if (labels.find(param)) {
          addr = labels.getPC(param);
          if (addr < 0 || addr > 0xffff) { return false; }
          pushWord(addr);
          return true;
        } else {
          pushWord(0xffff); // filler, only used while indexing labels
          return true;
        }
      }
      return false;
    }

    // Check if param is ZPX and push value
    function checkZeroPageX(param: string, opcode: number, symbols: Symbols) {
      let number: number;
      let value: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^([\w\$]+),X$/i);
      if (match_data) {
        const operand = tryParseByteOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushByte(operand);
          return true;
        }
      }
      
      return false;
    }

    // Check if param is ZPY and push value
    function checkZeroPageY(param: string, opcode: number, symbols: Symbols) {
      let number: number;
      let value: number;
      if (opcode === null) { return false; }
      
      const match_data = param.match(/^([\w\$]+),Y$/i);
      if (match_data) {
        const operand = tryParseByteOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushByte(operand);
          return true;
        }
      }
      
      return false;
    }

    // Check if param is ABS and push value
    function checkAbsolute(param: string, opcode: number, symbols: Symbols) {
      let value: number;
      let number: number;
      let addr: number;
      if (opcode === null) { return false; }

      const match_data = param.match(/^([\w\$]+)$/i);
      if (match_data) {
        const operand = tryParseWordOperand(match_data[1], symbols);
        if (operand >= 0) {
          pushByte(opcode);
          pushWord(operand);
          return true;
        }
      }

      // it could be a label too..
      if (param.match(/^\w+$/)) {
        pushByte(opcode);
        if (labels.find(param)) {
          addr = (labels.getPC(param));
          if (addr < 0 || addr > 0xffff) { return false; }
          pushWord(addr);
          return true;
        } else {
          pushWord(0xffff); // filler, only used while indexing labels
          return true;
        }
      }
      return false;
    }

    // Push a byte to memory
    function pushByte(value: number) {
      memory.set(defaultCodePC, value & 0xff);
      defaultCodePC++;
      codeLen++;
    }

    // Push a word to memory in little-endian order
    function pushWord(value: number) {
      pushByte(value & 0xff);
      pushByte((value >> 8) & 0xff);
    }

    function openPopup(content: string, title: string) {
      const w = window.open('', title, 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no');

      if(!w) {
        console.error('Failed to open popup');
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

    // Dump binary as hex to new window
    function hexdump() {
      openPopup(memory.format(0x600, codeLen), 'Hexdump');
    }

    // TODO: Create separate disassembler object?
    const addressingModes = [
      null,
      'Imm',
      'ZP',
      'ZPX',
      'ZPY',
      'ABS',
      'ABSX',
      'ABSY',
      'IND',
      'INDX',
      'INDY',
      'SNGL',
      'BRA'
    ];

    const instructionLength = {
      Imm: 2,
      ZP: 2,
      ZPX: 2,
      ZPY: 2,
      ABS: 3,
      ABSX: 3,
      ABSY: 3,
      IND: 3,
      INDX: 2,
      INDY: 2,
      SNGL: 1,
      BRA: 2
    };

    function getModeAndCode(byte: number): { opCode: string; mode: string } {
      let index: number | undefined;
      const line = Opcodes.filter(function (line) {
        const possibleIndex = line.indexOf(byte);
        if (possibleIndex > -1) {
          index = possibleIndex;
          return true;
        }
      })[0];

      if (!line) { //instruction not found
        return {
          opCode: '???',
          mode: 'SNGL'
        };
      } else {
        if (index === undefined) {
          throw new Error('Index is undefined');
        }
        return {
          opCode: line[0] as string,
          mode: addressingModes[index] as string
        };
      }
    }

    function createInstruction(address: number) {
      const bytes: number[] = [];
      let opCode: string;
      const args: number[] = [];
      let mode: string;

      function isAccumulatorInstruction() {
        const accumulatorBytes = [0x0a, 0x4a, 0x2a, 0x6a];
        if (accumulatorBytes.indexOf(bytes[0]) > -1) {
          return true;
        }
      }

      function isBranchInstruction() {
        return opCode.match(/^B/) && !(opCode == 'BIT' || opCode == 'BRK');
      }

      //This is gnarly, but unavoidably so?
      function formatArguments(args: number[]) {
        let argsString = args.map(num2hex).reverse().join('');

        if (isBranchInstruction()) {
          let destination = address + 2;
          if (args[0] > 0x7f) {
            destination -= 0x100 - args[0];
          } else {
            destination += args[0];
          }
          argsString = addr2hex(destination);
        }

        if (argsString) {
          argsString = '$' + argsString;
        }
        if (mode == 'Imm') {
          argsString = '#' + argsString;
        }
        if (mode.match(/X$/)) {
          argsString += ',X';
        }
        if (mode.match(/^IND/)) {
          argsString = '(' + argsString + ')';
        }
        if (mode.match(/Y$/)) {
          argsString += ',Y';
        }

        if (isAccumulatorInstruction()) {
          argsString = 'A';
        }

        return argsString;
      }

      return {
        addByte: function (byte: number) {
          bytes.push(byte);
        },
        setModeAndCode: function (modeAndCode: { opCode: string; mode: string }) {
          opCode = modeAndCode.opCode;
          mode = modeAndCode.mode;
        },
        addArg: function (arg: number) {
          args.push(arg);
        },
        toString: function () {
          const bytesString = bytes.map(num2hex).join(' ');
          const padding = Array(11 - bytesString.length).join(' ');
          return '$' + addr2hex(address) + '    ' + bytesString + padding + opCode +
            ' ' + formatArguments(args);
        }
      };
    }

    function disassemble() {
      const startAddress = 0x600;
      let currentAddress = startAddress;
      const endAddress = startAddress + codeLen;
      const instructions: string[] = [];
      let length: number;
      let inst: any;
      let byte: number;
      let modeAndCode: { opCode: string; mode: string };

      while (currentAddress < endAddress) {
        inst = createInstruction(currentAddress);
        byte = memory.get(currentAddress);
        inst.addByte(byte);

        modeAndCode = getModeAndCode(byte);
        length = instructionLength[modeAndCode.mode];
        inst.setModeAndCode(modeAndCode);

        for (let i = 1; i < length; i++) {
          currentAddress++;
          byte = memory.get(currentAddress);
          inst.addByte(byte);
          inst.addArg(byte);
        }
        instructions.push(inst);
        currentAddress++;
      }

      let html = 'Address  Hexdump   Dissassembly\n';
      html +=    '-------------------------------\n';
      html += instructions.join('\n');
      openPopup(html, 'Disassembly');
    }

    return {
      assembleLine: assembleLine,
      assembleCode: assembleCode,
      getCurrentPC: function () {
        return defaultCodePC;
      },
      hexdump: hexdump,
      disassemble: disassemble
    };
  }


  function addr2hex(addr: number) {
    return num2hex((addr >> 8) & 0xff) + num2hex(addr & 0xff);
  }

  function num2hex(nr: number) {
    const str = "0123456789abcdef";
    const hi = ((nr & 0xf0) >> 4);
    const lo = (nr & 15);
    return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
  }

  // Prints text in the message window
  function message(text: string) {
    if (text.length>1)
      text += '\n'; // allow putc operations from the simulator (WDM opcode)
    node.querySelector('.messages code')?.append(text) // .scrollTop(10000);
  }

  initialize();
}

