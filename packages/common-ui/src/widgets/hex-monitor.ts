import { memoryRegions } from "../data/index.js";
import type { HexMonitorOptions, MemoryRegion } from "../types/index.js";
import type { Memory } from "@learn6502/6502";

export interface HexMonitorWidget {
  readonly memoryRegions: MemoryRegion[];
  options: HexMonitorOptions;
  update(memory: Memory): void;
}
