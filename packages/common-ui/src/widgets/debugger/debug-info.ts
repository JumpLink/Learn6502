import type { Simulator } from "@learn6502/6502";

export interface DebugInfoWidget {
  update(simulator: Simulator): void;
}
