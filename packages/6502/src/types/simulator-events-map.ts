import type {
  SimulatorFailureEvent,
  SimulatorGotoEvent,
  SimulatorInfoEvent,
  SimulatorMultiStepEvent,
  SimulatorPseudoOpEvent,
  SimulatorResetEvent,
  SimulatorStartEvent,
  SimulatorStepEvent,
  SimulatorStopEvent,
} from "./simulator-events.js";

/**
 * Map of all simulator events and their corresponding payload types
 * This provides type-safety for the EventDispatcher in the Simulator class
 */
export interface SimulatorEventsMap {
  start: SimulatorStartEvent;
  step: SimulatorStepEvent;
  multistep: SimulatorMultiStepEvent;
  reset: SimulatorResetEvent;
  stop: SimulatorStopEvent;
  goto: SimulatorGotoEvent;
  "simulator-failure": SimulatorFailureEvent;
  "simulator-info": SimulatorInfoEvent;
  "pseudo-op": SimulatorPseudoOpEvent;
}
