import type { Assembler } from "../assembler.js";
import type { DisassembledData } from "./disassembled-data.js";

/**
 * Base interface for all assembler events
 */
export interface AssemblerBaseEvent {
  /** The assembler instance that triggered the event */
  assembler: Assembler;
  /** A message to display to the user */
  message?: string;
  /** Additional parameters for the message */
  params?: (string | number | boolean | null | undefined)[];
}

/**
 * Event emitted when assembly is successful
 */
export interface AssemblerSuccessEvent extends AssemblerBaseEvent {}

/**
 * Event emitted when assembly fails
 */
export interface AssemblerFailureEvent extends AssemblerBaseEvent {}

/**
 * Event emitted for hexdump output
 */
export interface AssemblerHexdumpEvent extends AssemblerBaseEvent {}

/**
 * Event emitted for informational messages from the Assembler
 */
export interface AssemblerInfoEvent extends AssemblerBaseEvent {}

/**
 * Event emitted when disassembly is generated
 */
export interface AssemblerDisassemblyEvent extends AssemblerBaseEvent {
  /** The disassembled data */
  data: DisassembledData;
}
