import type { Simulator } from "@learn6502/core";

export interface DebugInfoWidget {
  update(simulator: Simulator): void;
}
