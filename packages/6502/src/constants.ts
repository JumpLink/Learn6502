/**
 * Display pixel address range
 */
export enum DisplayAddressRange {
  /** Start address of display memory */
  START = 0x200,
  /** End address of display memory */
  END = 0x5ff,
}

export const ADDRESSING_MODES = [
  null,
  "Imm",
  "ZP",
  "ZPX",
  "ZPY",
  "ABS",
  "ABSX",
  "ABSY",
  "IND",
  "INDX",
  "INDY",
  "SNGL",
  "BRA",
] as const;

export const INSTRUCTION_LENGTH = {
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
  BRA: 2,
} as const;
