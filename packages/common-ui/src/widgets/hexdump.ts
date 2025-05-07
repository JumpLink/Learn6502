import type { Assembler } from "@learn6502/6502";

export interface HexdumpWidget {
  update(assembler: Assembler): void;
}
