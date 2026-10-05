import { Memory, Labels, Simulator, Assembler } from "@learn6502/core";

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
