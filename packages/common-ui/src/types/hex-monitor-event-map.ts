import type { MemoryRegion } from "./memory-region.js";

export interface HexMonitorEventMap {
  /**
   * Emitted when the user copies the hex monitor content.
   */
  copy: {
    /**
     * The hex monitor content.
     */
    content: string;
  };

  /**
   * Emitted when the hex monitor content is updated.
   */
  changed: {
    /**
     * The hex monitor content.
     */
    content: string;
    /**
     * The memory region.
     */
    region: MemoryRegion;
  };
}
