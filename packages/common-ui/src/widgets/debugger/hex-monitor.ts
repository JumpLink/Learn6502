import type { HexMonitorOptions, MemoryRegion, HexMonitorEventMap } from "../../types/index.js";
import type { Memory } from "@learn6502/core";
import type { EventDispatcher } from "@learn6502/core";

export interface HexMonitorWidget {
  readonly events: EventDispatcher<HexMonitorEventMap>;
  readonly memoryRegions: MemoryRegion[];
  options: HexMonitorOptions;
  update(memory: Memory): void;
}
