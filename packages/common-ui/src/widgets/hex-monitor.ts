import type { HexMonitorOptions } from "../types/index.js";
import type { Memory } from "@learn6502/6502";

export interface HexMonitorWidget {
  options: HexMonitorOptions;
  update(memory: Memory): void;
}
