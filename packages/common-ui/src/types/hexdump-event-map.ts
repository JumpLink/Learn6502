import type { MemoryRegion } from "./memory-region.js";

export interface HexdumpEventMap {
  /**
   * Emitted when the user copies the hex dump content.
   */
  copy: {
    /**
     * The hex dump content.
     */
    content: string;
  };
}
