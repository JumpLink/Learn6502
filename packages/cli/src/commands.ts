import { readFileSync } from "node:fs";

import { createSimulatorStack } from "@learn6502/common-ui";
import { formatMessage } from "@learn6502/core";

import { AnsiDisplay } from "./ansi-display.js";

/** Default safety cap so a program with an unbounded loop (e.g. a game waiting
 * for input the CLI never sends) still terminates instead of spinning forever. */
const DEFAULT_MAX_STEPS = 500_000;

function readSource(file: string): string {
  return readFileSync(file, "utf8");
}

/** Assemble the source, printing the assembler's own success/failure message. */
export function assemble(file: string): number {
  const { assembler } = createSimulatorStack();
  let message = "";
  assembler.on("assemble-success", (event) => {
    message = formatMessage(event.message ?? "", event.params ?? []);
  });
  assembler.on("assemble-failure", (event) => {
    message = formatMessage(event.message ?? "", event.params ?? []);
  });

  const ok = assembler.assembleCode(readSource(file));
  if (ok) console.log(message);
  else console.error(message || "Assembly failed.");
  return ok ? 0 : 1;
}

/** Assemble, run to completion (or the step cap), and render the display. */
export function run(file: string, maxSteps = DEFAULT_MAX_STEPS): number {
  const { assembler, simulator, memory } = createSimulatorStack();

  let failureMessage = "";
  assembler.on("assemble-failure", (event) => {
    failureMessage = formatMessage(event.message ?? "", event.params ?? []);
  });
  if (!assembler.assembleCode(readSource(file))) {
    console.error(failureMessage || "Assembly failed.");
    return 1;
  }

  const display = new AnsiDisplay();
  display.initialize(memory);

  simulator.reset();
  let completed = false;
  simulator.on("stop", () => {
    completed = true;
  });

  let steps = 0;
  while (!completed && steps < maxSteps) {
    simulator.debugExecStep();
    steps++;
  }

  process.stdout.write(display.render());
  if (completed) {
    console.log(`Program completed after ${steps} steps.`);
  } else {
    console.log(`Stopped at the ${maxSteps}-step cap — the program may loop or wait for input.`);
  }
  return 0;
}

/** Assemble and print a hexdump of the machine code. */
export function hexdump(file: string): number {
  const { assembler } = createSimulatorStack();
  if (!assembler.assembleCode(readSource(file))) {
    console.error("Assembly failed.");
    return 1;
  }
  console.log(assembler.hexdump({ includeAddress: true, includeSpaces: true, includeNewline: true }));
  return 0;
}

/** Assemble and print the disassembly of the machine code. */
export function disasm(file: string): number {
  const { assembler } = createSimulatorStack();
  if (!assembler.assembleCode(readSource(file))) {
    console.error("Assembly failed.");
    return 1;
  }
  console.log(assembler.disassemble().formatted);
  return 0;
}
