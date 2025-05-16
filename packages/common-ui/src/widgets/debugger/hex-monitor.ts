import type {
  HexMonitorOptions,
  MemoryRegion,
  HexMonitorEventMap,
} from "../../types/index.js";
import type { Memory } from "@learn6502/6502";
import type { EventDispatcher } from "@learn6502/6502";

export interface HexMonitorWidget {
  readonly events: EventDispatcher<HexMonitorEventMap>;
  readonly memoryRegions: MemoryRegion[];
  options: HexMonitorOptions;
  update(memory: Memory): void;
}
