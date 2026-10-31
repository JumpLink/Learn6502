import type { MemoryRegion } from "./memory-region.js";

export interface HexMonitorEventMap {
  /**
   * Emitted when the user copies the hex monitor content.
   */
  copy: HexMonitorCopyEvent;
  /**
   * Emitted when the hex monitor content is updated.
   */
  changed: HexMonitorChangedEvent;
}

export interface HexMonitorCopyEvent {
  /**
   * The hex monitor content.
   */
  content: string;
}

export interface HexMonitorChangedEvent {
  /**
   * The hex monitor content.
   */
  content: string;
  /**
   * The memory region.
   */
  region: MemoryRegion;
}
