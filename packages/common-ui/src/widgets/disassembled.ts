import type { Assembler } from "@learn6502/6502";

export interface DisassembledWidget {
  update(assembler: Assembler): void;
}
