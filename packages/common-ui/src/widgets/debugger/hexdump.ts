import type { Assembler, EventDispatcher } from "@learn6502/core";
import type { HexdumpEventMap } from "../../types/index.js";

export interface HexdumpWidget {
  readonly events: EventDispatcher<HexdumpEventMap>;
  update(assembler: Assembler): void;
}
