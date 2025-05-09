import type { Simulator } from "../simulator.js";
import type { SimulatorState } from "./simulator-state.js";

/**
 * Base interface for all simulator events
 * Contains common properties shared across all simulator events
 */
export interface SimulatorBaseEvent {
  /** The simulator instance that triggered the event */
  simulator: Simulator;
  /** A message to display to the user */
  message?: string;
  /** The current state of the simulator */
  state: SimulatorState;
  /** Additional parameters for the message */
  params?: (string | number | boolean | null | undefined)[];
}
