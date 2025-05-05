import { ContrastMode } from "../constants";
import { PropertyChangeEvent } from "./property-change-event";

/**
 * Interface for contrast change events
 */
export interface ContrastChangeEvent
  extends PropertyChangeEvent<ContrastMode> {}
