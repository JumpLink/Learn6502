import type { Simulator } from '../simulator.js';
import type { SimulatorState } from './simulator-state.js';

export interface SimulatorEvent {
    /** The simulator instance that triggered the event */
    simulator: Simulator;
    /** A message to display to the user */
    message?: string;
    /** The current state of the simulator */
    state: SimulatorState;
    /**Only used for pseudo op events */
    type?: string;
}