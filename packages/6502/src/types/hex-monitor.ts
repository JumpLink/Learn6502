import type { HexMonitorOptions } from "./index.js";
import type { Memory } from "../memory.js";

export interface HexMonitor {
  options: HexMonitorOptions;
  update(memory: Memory): void;
}
