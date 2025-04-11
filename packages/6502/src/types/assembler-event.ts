import type { Assembler } from '../assembler.js';

export interface AssemblerEvent {
  assembler: Assembler;
  /** A message to display to the user */
  message?: string;
  /** Additional parameters for the message */
  params?: (string | number | boolean | null | undefined)[];
}