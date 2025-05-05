import { PropertyChangeEvent } from "./property-change-event";

/**
 * Interface for system appearance change events
 */
export interface SystemAppearanceChangeEvent
  extends PropertyChangeEvent<"light" | "dark" | null> {}
