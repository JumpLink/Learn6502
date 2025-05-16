import type { InstructionData } from "./instruction-data.js";

export interface DisassembledData {
  formatted: string;
  startAddress: number;
  endAddress: number;
  instructions: InstructionData[];
}
