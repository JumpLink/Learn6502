import type { Assembler } from "../assembler.js";

export interface Hexdump {
  update(assembler: Assembler): void;
}
