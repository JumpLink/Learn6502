import type { ContrastMode } from "../constants";
import type { PropertyChangeEvent } from "./property-change-event";

/**
 * Interface for contrast change events
 */
export interface ContrastChangeEvent extends PropertyChangeEvent<ContrastMode> {}
