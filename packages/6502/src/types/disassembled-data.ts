export interface DisassembledData {
  formatted: string;
  startAddress: number;
  endAddress: number;
  instructions: InstructionData[];
}

export interface InstructionData {
  address: number;
  bytes: number[];
  hexBytes: string;
  opCode: string;
  mode: string;
  args: number[];
  formattedArgs: string;
  formattedInstruction: string;
}
