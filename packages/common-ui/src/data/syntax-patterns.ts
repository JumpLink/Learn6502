/**
 * Complete 6502 instruction set and syntax highlighting patterns.
 * Shared between platforms for consistent syntax support.
 */

/** All 56 official 6502 opcodes */
export const OPCODES_6502 = [
  // Load/Store
  "LDA",
  "LDX",
  "LDY",
  "STA",
  "STX",
  "STY",
  // Transfer
  "TAX",
  "TAY",
  "TXA",
  "TYA",
  "TSX",
  "TXS",
  // Stack
  "PHA",
  "PHP",
  "PLA",
  "PLP",
  // Arithmetic
  "ADC",
  "SBC",
  // Increment/Decrement
  "INC",
  "INX",
  "INY",
  "DEC",
  "DEX",
  "DEY",
  // Logical
  "AND",
  "ORA",
  "EOR",
  // Shift/Rotate
  "ASL",
  "LSR",
  "ROL",
  "ROR",
  // Compare
  "CMP",
  "CPX",
  "CPY",
  "BIT",
  // Branch
  "BCC",
  "BCS",
  "BEQ",
  "BMI",
  "BNE",
  "BPL",
  "BVC",
  "BVS",
  // Jump/Call
  "JMP",
  "JSR",
  "RTS",
  "RTI",
  // Flags
  "CLC",
  "CLD",
  "CLI",
  "CLV",
  "SEC",
  "SED",
  "SEI",
  // System
  "BRK",
  "NOP",
] as const;

/** Regex pattern string matching all 6502 opcodes (case-insensitive) */
export const OPCODE_PATTERN = `\\b(${OPCODES_6502.join("|")})\\b`;

/** Regex pattern string matching 6502 comments (semicolon to end of line) */
export const COMMENT_PATTERN = ";.*";

/** Regex pattern string matching hex values ($FF, #$FF) */
export const HEX_VALUE_PATTERN = "(\\$[0-9A-Fa-f]+|#\\$[0-9A-Fa-f]+)";

/** Regex pattern string matching labels (word followed by colon at start of line) */
export const LABEL_PATTERN = "^\\w+:";

/** Regex pattern string matching assembler directives (DCB, define, etc.) */
export const DIRECTIVE_PATTERN = "\\b(DCB|define)\\b";
