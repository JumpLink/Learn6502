/**
 * Memory region definitions
 *
 * These are used to define the memory regions that are displayed in the hex monitor.
 *
 * The name is used to label the memory region.
 * The start is the starting address of the memory region.
 * The length is the length of the memory region.
 */
export interface MemoryRegion {
  /**
   * The name of the memory region.
   */
  name: string;
  /**
   * The starting address of the memory region.
   */
  start: number;
  /**
   * The length of the memory region.
   */
  length: number;
}
