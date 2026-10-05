/**
 * Event emitted when a memory location is changed
 */
export interface MemoryChangedEvent {
  /** The address of the memory location that changed */
  addr: number;
  /** The value of the memory location that changed */
  val: number;
}
