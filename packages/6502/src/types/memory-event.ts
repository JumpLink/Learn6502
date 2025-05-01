export interface MemoryEvent {
  /** The address of the memory location that changed */
  addr: number;
  /** The value of the memory location that changed */
  val: number;
}
