import type { Simulator } from "../simulator.js";

export interface DebugInfo {
  update(simulator: Simulator): void;
}
