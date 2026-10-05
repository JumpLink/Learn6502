/**
 * Generic interface for property change events
 */
export interface PropertyChangeEvent<T> {
  newValue: T;
  oldValue: T | null;
  initial: boolean;
}
