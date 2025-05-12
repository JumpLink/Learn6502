import type { Assembler, EventDispatcher } from "@learn6502/6502";
import type { DisassembledEventMap } from "../../types/index.js";

export interface DisassembledWidget {
  update(assembler: Assembler): void;
  events: EventDispatcher<DisassembledEventMap>;
}
