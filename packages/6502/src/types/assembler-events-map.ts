import type {
  AssemblerDisassemblyEvent,
  AssemblerFailureEvent,
  AssemblerHexdumpEvent,
  AssemblerInfoEvent,
  AssemblerSuccessEvent,
} from "./assembler-events.js";

/**
 * Map of all assembler events and their corresponding payload types
 * This provides type-safety for the EventDispatcher in the Assembler class
 */
export interface AssemblerEventsMap {
  /**
   * Emitted when assembly is successful
   */
  "assemble-success": AssemblerSuccessEvent;

  /**
   * Emitted when assembly fails
   */
  "assemble-failure": AssemblerFailureEvent;

  /**
   * Emitted for hexdump output
   */
  hexdump: AssemblerHexdumpEvent;

  /**
   * Emitted when disassembly is generated
   */
  disassembly: AssemblerDisassemblyEvent;

  /**
   * Emitted for informational messages from the Assembler
   */
  "assemble-info": AssemblerInfoEvent;
}
