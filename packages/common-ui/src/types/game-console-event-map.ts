import {
  type AssemblerSuccessEvent,
  type AssemblerFailureEvent,
  type AssemblerHexdumpEvent,
  type AssemblerDisassemblyEvent,
  type AssemblerInfoEvent,
  type SimulatorStartEvent,
  type SimulatorStepEvent,
  type SimulatorMultiStepEvent,
  type SimulatorResetEvent,
  type SimulatorStopEvent,
  type SimulatorGotoEvent,
  type SimulatorFailureEvent,
  type SimulatorInfoEvent,
  type SimulatorPseudoOpEvent,
  type LabelsInfoEvent,
  type LabelsFailureEvent,
} from "@learn6502/6502";
import type { GamepadEvent } from "./gamepad-event";

/**
 * Event map for all game console events
 */
export interface GameConsoleEventMap {
  // Gamepad events
  keyPressed: GamepadEvent;

  // Assembler events
  "assemble-success": AssemblerSuccessEvent;
  "assemble-failure": AssemblerFailureEvent;
  hexdump: AssemblerHexdumpEvent;
  disassembly: AssemblerDisassemblyEvent;
  "assemble-info": AssemblerInfoEvent;

  // Simulator events
  stop: SimulatorStopEvent;
  start: SimulatorStartEvent;
  reset: SimulatorResetEvent;
  step: SimulatorStepEvent;
  multistep: SimulatorMultiStepEvent;
  goto: SimulatorGotoEvent;
  "pseudo-op": SimulatorPseudoOpEvent;
  "simulator-info": SimulatorInfoEvent;
  "simulator-failure": SimulatorFailureEvent;

  // Labels events
  "labels-info": LabelsInfoEvent;
  "labels-failure": LabelsFailureEvent;
}
