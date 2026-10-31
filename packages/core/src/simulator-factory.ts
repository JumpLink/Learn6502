import { Memory } from "./memory.js";
import { Labels } from "./labels.js";
import { Simulator } from "./simulator.js";
import { Assembler } from "./assembler.js";

export interface SimulatorStack {
  memory: Memory;
  labels: Labels;
  simulator: Simulator;
  assembler: Assembler;
}

/**
 * Creates a fully wired simulator stack with memory, labels, simulator, and assembler.
 * Used by both Android and GNOME platforms to avoid duplicating initialization logic.
 */
export function createSimulatorStack(): SimulatorStack {
  const memory = new Memory();
  const labels = new Labels();
  const simulator = new Simulator(memory, labels);
  const assembler = new Assembler(memory, labels);
  return { memory, labels, simulator, assembler };
}
