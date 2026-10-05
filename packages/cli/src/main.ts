import { assemble, disasm, hexdump, run } from "./commands.js";

const USAGE = `learn6502 — headless 6502 assembler / simulator

The command-line frontend of Learn6502, built on the SAME @learn6502/core
(assembler + simulator) and @learn6502/common-ui (the DisplayWidget contract)
that the GNOME, web and Android apps use.

Usage:
  learn6502 assemble <file.asm>   Assemble and report the result
  learn6502 run <file.asm>        Assemble, run, and render the display
  learn6502 hexdump <file.asm>    Assemble and print a hexdump
  learn6502 disasm <file.asm>     Assemble and print the disassembly
`;

function main(): number {
  const [command, file] = process.argv.slice(2);

  if (!command || command === "--help" || command === "-h") {
    console.log(USAGE);
    return command ? 0 : 1;
  }

  const commands: Record<string, (file: string) => number> = { assemble, run, hexdump, disasm };
  const handler = commands[command];
  if (!handler) {
    console.error(`Unknown command "${command}".\n\n${USAGE}`);
    return 1;
  }

  if (!file) {
    console.error(`Missing <file.asm> for "${command}".\n\n${USAGE}`);
    return 1;
  }

  return handler(file);
}

process.exit(main());
