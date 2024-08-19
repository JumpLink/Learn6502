export interface Debugger {
  /**
   * Set the monitor address range.
   */
  setMonitorRange(startAddress: number, length: number): void;
}