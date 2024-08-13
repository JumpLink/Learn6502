import { Memory } from './memory.js';
import { Labels } from './labels.js';
import { UI } from './ui.js';
import { addr2hex, num2hex, message } from './utils.js';

import type { Symbols } from './types/index.js';

/**
 * Represents the assembler for the 6502 emulator.
 */
export class Assembler {
  private defaultCodePC: number;
  private codeLen: number;
  private codeAssembledOK = false;
  private wasOutOfRangeBranch = false;

  private opcodes = [
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

  // TODO: Create separate disassembler object?
  private addressingModes = [
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

  private instructionLength = {
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

  constructor(protected readonly node: HTMLElement, protected readonly memory: Memory, protected readonly labels: Labels, protected readonly ui: UI) {

  }

  /**
   * Assembles the code into memory.
   * @returns True if assembly was successful, false otherwise.
   */
  public assembleCode() {
    const BOOTSTRAP_ADDRESS = 0x600;
    const $messagesCode = this.node.querySelector<HTMLElement>('.messages code')

    if (!$messagesCode) {
      throw new Error("Could not find code element");
    }

    this.wasOutOfRangeBranch = false;

    this.defaultCodePC = BOOTSTRAP_ADDRESS;
    $messagesCode.innerHTML = "";

    let code = this.node.querySelector<HTMLTextAreaElement>('.code')?.value || "";
    code += "\n\n";
    const lines = code.split("\n");
    this.codeAssembledOK = true;

    message(this.node, "Preprocessing ...");
    const symbols = this.preprocess(lines);

    message(this.node, "Indexing labels ...");
    this.defaultCodePC = BOOTSTRAP_ADDRESS;
    if (!this.labels.indexLines(lines, symbols, this)) {
      return false;
    }
    this.labels.displayMessage();

    this.defaultCodePC = BOOTSTRAP_ADDRESS;
    message(this.node, "Assembling code ...");

    this.codeLen = 0;
    let i = 0;
    for (i = 0; i < lines.length; i++) {
      if (!this.assembleLine(lines[i], i, symbols)) {
        this.codeAssembledOK = false;
        break;
      }
    }

    const lastLine = lines[i];

    if (this.codeLen === 0) {
      this.codeAssembledOK = false;
      message(this.node, "No code to run.");
    }

    if (this.codeAssembledOK) {
      // TODO: Remove ui reference
      this.ui.assembleSuccess();
      this.memory.set(this.defaultCodePC, 0x00); //set a null byte at the end of the code
    } else {

      if (lastLine) {
        const str = lines[i].replace("<", "&lt;").replace(">", "&gt;");
        if (!this.wasOutOfRangeBranch) {
          message(this.node, "**Syntax error line " + (i + 1) + ": " + str + "**");
        } else {
          message(this.node, '**Out of range branch on line ' + (i + 1) + ' (branches are limited to -128 to +127): ' + str + '**');
        }
      }

      // TODO: Remove ui reference
      this.ui.initialize();
      return false;
    }

    message(this.node, "Code assembled successfully, " + this.codeLen + " bytes.");
    return true;
  }

  /**
   * Sanitize input: remove comments and trim leading/trailing whitespace
   */
  private sanitize(line: string) {
    // remove comments
    const no_comments = line.replace(/^(.*?);.*/, "$1");

    // trim line
    return no_comments.replace(/^\s+/, "").replace(/\s+$/, "");
  }

  /**
   * Preprocesses the assembly code.
   * @param lines - The lines of code to preprocess.
   * @returns A Symbols object containing defined symbols.
   */
  private preprocess(lines: string[]): Symbols {
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
      lines[i] = this.sanitize(lines[i]);
      const match_data = lines[i].match(/^define\s+(\w+)\s+(\S+)/);
      if (match_data) {
        add(match_data[1], this.sanitize(match_data[2]));
        lines[i] = ""; // We're done with this preprocessor directive, so delete it
      }
    }

    // Callers will only need the lookup function
    return {
      lookup: lookup
    }
  }

  /**
   * Assembles a single line of code.
   * @param input - The line of code to assemble.
   * @param lineno - The line number (for error reporting).
   * @param symbols - The symbols table.
   * @returns True if assembly was successful, false otherwise.
   */
  public assembleLine(input: string, lineno: number, symbols: Symbols) {
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
        message(this.node, "Unable to relocate code outside 64k memory");
        return false;
      }
      this.defaultCodePC = addr;
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
      return this.DCB(param);
    }
    for (let o = 0; o < this.opcodes.length; o++) {
      if (this.opcodes[o][0] === command) {
        if (this.checkSingle(param, this.opcodes[o][11] as number)) { return true; }
        if (this.checkImmediate(param, this.opcodes[o][1] as number, symbols)) { return true; }
        if (this.checkZeroPage(param, this.opcodes[o][2] as number, symbols)) { return true; }
        if (this.checkZeroPageX(param, this.opcodes[o][3] as number, symbols)) { return true; }
        if (this.checkZeroPageY(param, this.opcodes[o][4] as number, symbols)) { return true; }
        if (this.checkAbsoluteX(param, this.opcodes[o][6] as number, symbols)) { return true; }
        if (this.checkAbsoluteY(param, this.opcodes[o][7] as number, symbols)) { return true; }
        if (this.checkIndirect(param, this.opcodes[o][8] as number, symbols)) { return true; }
        if (this.checkIndirectX(param, this.opcodes[o][9] as number, symbols)) { return true; }
        if (this.checkIndirectY(param, this.opcodes[o][10] as number, symbols)) { return true; }
        if (this.checkAbsolute(param, this.opcodes[o][5] as number, symbols)) { return true; }
        if (this.checkBranch(param, this.opcodes[o][12] as number)) { return true; }
      }
    }

    return false; // Unknown syntax
  }

  /**
   * DCB (Define Constant Byte) method
   * 
   * This method allows direct definition of data bytes in the assembler code.
   * It processes a comma-separated list of values and writes them to memory.
   * 
   * @param param - A string containing comma-separated values
   * @returns true if all values were successfully processed, false otherwise
   * 
   * Supported formats:
   * - Hexadecimal: prefixed with "$" (e.g., $FF)
   * - Binary: prefixed with "%" (e.g., %10101010)
   * - Decimal: no prefix, just numbers (e.g., 42)
   * 
   * Usage example in 6502 assembly:
   * DCB $FF, $00, %10101010, 42
   * 
   * This would write four bytes to memory: 255 (0xFF), 0, 170 (0xAA), and 42.
   */
  private DCB(param: string) {
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
          this.pushByte(number);
        } else if (ch === "%") {
          number = parseInt(str.replace(/^%/, ""), 2)
          this.pushByte(number)
        } else if (ch >= "0" && ch <= "9") {
          number = parseInt(str, 10);
          this.pushByte(number);
        } else {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Try to parse the given parameter as a byte operand.
   * Returns the (positive) value if successful, otherwise -1
   */
  private tryParseByteOperand(param: string, symbols: Symbols) {
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

  /**
   * Try to parse the given parameter as a word operand.
   * Returns the (positive) value if successful, otherwise -1
   */
  private tryParseWordOperand(param: string, symbols: Symbols) {
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

  /**
   * Common branch function for all branches (BCC, BCS, BEQ, BNE..)
   */
  private checkBranch(param: string, opcode: number) {
    let addr: number;
    if (opcode === null) { return false; }

    addr = -1;
    if (param.match(/\w+/)) {
      addr = this.labels.getPC(param);
    }
    if (addr === -1) { this.pushWord(0x00); return false; }
    this.pushByte(opcode);

    const distance = addr - this.defaultCodePC - 1;

    if (distance < -128 || distance > 127) {
      this.wasOutOfRangeBranch = true;
      return false;
    }

    this.pushByte(distance);
    return true;
  }

  /**
   * Check if param is immediate and push value
   */
  private checkImmediate(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    let label: string;
    let hilo: string;
    let addr: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^#([\w\$%]+)$/i);
    if (match_data) {
      const operand = this.tryParseByteOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushByte(operand);
        return true;
      }
    }

    // Label lo/hi
    if (param.match(/^#[<>]\w+$/)) {
      label = param.replace(/^#[<>](\w+)$/, "$1");
      hilo = param.replace(/^#([<>]).*$/, "$1");
      this.pushByte(opcode);
      if (this.labels.find(label)) {
        addr = this.labels.getPC(label);
        switch (hilo) {
          case ">":
            this.pushByte((addr >> 8) & 0xff);
            return true;
          case "<":
            this.pushByte(addr & 0xff);
            return true;
          default:
            return false;
        }
      } else {
        this.pushByte(0x00);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if param is indirect and push value
   */
  private checkIndirect(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^\(([\w\$]+)\)$/i);
    if (match_data) {
      const operand = this.tryParseWordOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushWord(operand);
        return true;
      }
    }
    return false;
  }

  /**
   * Check if param is indirect X and push value
   */
  private checkIndirectX(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^\(([\w\$]+),X\)$/i);
    if (match_data) {
      const operand = this.tryParseByteOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushByte(operand);
        return true;
      }
    }
    return false;
  }

  /**
   * Check if param is indirect Y and push value
   */
  private checkIndirectY(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^\(([\w\$]+)\),Y$/i);
    if (match_data) {
      const operand = this.tryParseByteOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushByte(operand);
        return true;
      }
    }
    return false;
  }

  /**
   * Check single-byte opcodes
   */
  private checkSingle(param: string, opcode: number) {
    if (opcode === null) { return false; }
    // Accumulator instructions are counted as single-byte opcodes
    if (param !== "" && param !== "A") { return false; }
    this.pushByte(opcode);
    return true;
  }

  /**
   * Check if param is ZP and push value
   */
  private checkZeroPage(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    if (opcode === null) { return false; }

    const operand = this.tryParseByteOperand(param, symbols);
    if (operand >= 0) {
      this.pushByte(opcode);
      this.pushByte(operand);
      return true;
    }

    return false;
  }

  /**
   * Check if param is ABSX and push value
   */
  private checkAbsoluteX(param: string, opcode: number, symbols: Symbols) {
    let number: number;
    let value: number;
    let addr: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^([\w\$]+),X$/i);
    if (match_data) {
      const operand = this.tryParseWordOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushWord(operand);
        return true;
      }
    }

    // it could be a label too..
    if (param.match(/^\w+,X$/i)) {
      param = param.replace(/,X$/i, "");
      this.pushByte(opcode);
      if (this.labels.find(param)) {
        addr = this.labels.getPC(param);
        if (addr < 0 || addr > 0xffff) { return false; }
        this.pushWord(addr);
        return true;
      } else {
        this.pushWord(0xffff); // filler, only used while indexing labels
        return true;
      }
    }

    return false;
  }

  /**
   * Check if param is ABSY and push value
   */
  private checkAbsoluteY(param: string, opcode: number, symbols: Symbols) {
    let number: number;
    let value: number;
    let addr: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^([\w\$]+),Y$/i);
    if (match_data) {
      const operand = this.tryParseWordOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushWord(operand);
        return true;
      }
    }

    // it could be a label too..
    if (param.match(/^\w+,Y$/i)) {
      param = param.replace(/,Y$/i, "");
      this.pushByte(opcode);
      if (this.labels.find(param)) {
        addr = this.labels.getPC(param);
        if (addr < 0 || addr > 0xffff) { return false; }
        this.pushWord(addr);
        return true;
      } else {
        this.pushWord(0xffff); // filler, only used while indexing labels
        return true;
      }
    }
    return false;
  }

  /**
   * Check if param is ZPX and push value
   */
  private checkZeroPageX(param: string, opcode: number, symbols: Symbols) {
    let number: number;
    let value: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^([\w\$]+),X$/i);
    if (match_data) {
      const operand = this.tryParseByteOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushByte(operand);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if param is ZPY and push value
   */
  private checkZeroPageY(param: string, opcode: number, symbols: Symbols) {
    let number: number;
    let value: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^([\w\$]+),Y$/i);
    if (match_data) {
      const operand = this.tryParseByteOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushByte(operand);
        return true;
      }
    }

    return false;
  }

  /**
   * Check if param is ABS and push value
   */
  private checkAbsolute(param: string, opcode: number, symbols: Symbols) {
    let value: number;
    let number: number;
    let addr: number;
    if (opcode === null) { return false; }

    const match_data = param.match(/^([\w\$]+)$/i);
    if (match_data) {
      const operand = this.tryParseWordOperand(match_data[1], symbols);
      if (operand >= 0) {
        this.pushByte(opcode);
        this.pushWord(operand);
        return true;
      }
    }

    // it could be a label too..
    if (param.match(/^\w+$/)) {
      this.pushByte(opcode);
      if (this.labels.find(param)) {
        addr = this.labels.getPC(param);
        if (addr < 0 || addr > 0xffff) { return false; }
        this.pushWord(addr);
        return true;
      } else {
        this.pushWord(0xffff); // filler, only used while indexing labels
        return true;
      }
    }
    return false;
  }

  /**
   * Push a byte to memory
   */
  private pushByte(value: number) {
    this.memory.set(this.defaultCodePC, value & 0xff);
    this.defaultCodePC++;
    this.codeLen++;
  }

  /**
   * Push a word to memory in little-endian order
   */
  private pushWord(value: number) {
    this.pushByte(value & 0xff);
    this.pushByte((value >> 8) & 0xff);
  }

  /**
   * Opens a popup window with the given content.
   * @param content - The content to display in the popup.
   * @param title - The title of the popup window.
   */
  private openPopup(content: string, title: string) {
    const w = window.open('', title, 'width=500,height=300,resizable=yes,scrollbars=yes,toolbar=no,location=no,menubar=no,status=no');

    if (!w) {
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

  /**
   * Generates a hexdump of the assembled code.
   */
  public hexdump() {
    this.openPopup(this.memory.format(0x600, this.codeLen), 'Hexdump');
  }

  private getModeAndCode(byte: number): { opCode: string; mode: string } {
    let index: number | undefined;
    const line = this.opcodes.filter(function (line) {
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
        mode: this.addressingModes[index] as string
      };
    }
  }

  private createInstruction(address: number) {
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

  /**
   * Disassembles the assembled code.
   */
  public disassemble() {
    const startAddress = 0x600;
    let currentAddress = startAddress;
    const endAddress = startAddress + this.codeLen;
    const instructions: string[] = [];
    let length: number;
    let inst: any;
    let byte: number;
    let modeAndCode: { opCode: string; mode: string };

    while (currentAddress < endAddress) {
      inst = this.createInstruction(currentAddress);
      byte = this.memory.get(currentAddress);
      inst.addByte(byte);

      modeAndCode = this.getModeAndCode(byte);
      length = this.instructionLength[modeAndCode.mode];
      inst.setModeAndCode(modeAndCode);

      for (let i = 1; i < length; i++) {
        currentAddress++;
        byte = this.memory.get(currentAddress);
        inst.addByte(byte);
        inst.addArg(byte);
      }
      instructions.push(inst);
      currentAddress++;
    }

    let html = 'Address  Hexdump   Dissassembly\n';
    html += '-------------------------------\n';
    html += instructions.join('\n');
    this.openPopup(html, 'Disassembly');
  }

  /**
   * Gets the current program counter.
   * @returns The current program counter value.
   */
  public getCurrentPC(): number {
    return this.defaultCodePC;
  }
}