# @learn6502/core

A standalone **6502 assembler, simulator and disassembler** written in TypeScript.

This is the engine behind [Learn 6502 Assembly](https://github.com/JumpLink/Learn6502) — the
GNOME / Web / Android learning app — extracted as a dependency-free, runtime-agnostic library. It
has **no runtime dependencies** and runs anywhere modern JavaScript does: Node.js, [GJS](https://gjs.guide/)
(GNOME / SpiderMonkey) and the browser.

## What it does

- **Assemble** 6502 assembly source into machine code.
- **Simulate** that machine code with a full 6502 CPU emulation (registers, flags, stack, the
  64 KB address space, a memory-mapped display region and a keypress input cell).
- **Disassemble** machine code back into readable, structured instructions.
- **Observe everything** through typed events — assembly success/failure, every executed step,
  memory writes, label resolution, and more.

## Installation

```bash
npm install @learn6502/core
# or
yarn add @learn6502/core
# or
pnpm add @learn6502/core
```

The package ships ES modules with bundled TypeScript declarations.

## Quick start

The library is built around four small classes. The `Assembler` and the `Simulator` operate on a
**shared** `Memory` and `Labels` instance — assemble into memory, then run it:

```ts
import { Memory, Labels, Assembler, Simulator } from "@learn6502/core";

// 1. Wire up the four core pieces (Assembler + Simulator share Memory + Labels).
const memory = new Memory();
const labels = new Labels();
const assembler = new Assembler(memory, labels);
const simulator = new Simulator(memory, labels);

// 2. React to assembly + execution via typed events.
assembler.on("assemble-failure", (e) => console.error("Assembly error:", e.message));
simulator.on("stop", () => {
  console.log("Accumulator (A):", simulator.info.regA);
  console.log("$0200 =", memory.get(0x0200));
});

// 3. Assemble a small program — machine code is written into memory at $0600.
const ok = assembler.assembleCode(`
  LDA #$07      ; load 7 into the accumulator
  STA $0200     ; store it to the top-left display pixel
  BRK           ; stop the program
`);

// 4. Run it. Execution is asynchronous (driven by a timer); the "stop" event
//    above fires when the program reaches BRK.
if (ok) simulator.runBinary();
```

## Core classes

| Class | Constructor | Purpose |
|-------|-------------|---------|
| `Memory` | `new Memory()` | The 64 KB (`0x0000`–`0xFFFF`) address space. `get(addr)` / `set(addr, val)`, `getWord(addr)`, `storeKeypress(val)`, `format(...)`. |
| `Labels` | `new Labels()` | Symbol table mapping label names to addresses. `find(name)`, `getPC(name)`, `reset()`. |
| `Assembler` | `new Assembler(memory, labels)` | `assembleCode(src)` → writes machine code to memory; `disassemble()`, `hexdump(...)`, `getCurrentPC()`. |
| `Simulator` | `new Simulator(memory, labels)` | `runBinary()` (start/stop), `debugExecStep()`, `reset()`, `gotoAddr(...)`, `enableStepper()` / `stopStepper()`; `info` and `state` getters. |

`new Assembler(memory, labels)` and `new Simulator(memory, labels)` must be given the **same**
`memory` and `labels` objects so the assembled program and the simulator share state.

### Reading CPU state

```ts
const { regA, regX, regY, regP, regPC, regSP } = simulator.info;
```

### `SimulatorState`

`simulator.state` returns a value of the exported `SimulatorState` enum:

```ts
import { SimulatorState } from "@learn6502/core";

// "initialized" | "ready" | "running" | "paused"
// | "debugging" | "debugging_paused" | "completed"
if (simulator.state === SimulatorState.COMPLETED) { /* … */ }
```

## Events

`Memory`, `Labels`, `Assembler` and `Simulator` each expose a typed event API — `on(event, listener)`,
`off(event, listener)` and `once(event, listener)` — with a per-class event map so payloads are fully
typed.

| Emitter | Events |
|---------|--------|
| `Assembler` | `assemble-success`, `assemble-failure`, `hexdump`, `disassembly`, `assemble-info` |
| `Simulator` | `start`, `step`, `multistep`, `reset`, `stop`, `goto`, `simulator-failure`, `simulator-info`, `pseudo-op` |
| `Memory` | `changed` — `{ addr, val }` for every byte written |
| `Labels` | `labels-info`, `labels-failure` |

```ts
// Drive a live display from memory writes inside the display region.
memory.on("changed", ({ addr, val }) => {
  if (addr >= 0x0200 && addr <= 0x05ff) drawPixel(addr - 0x0200, val);
});
```

The same generic mechanism is exported as `EventDispatcher<TEventMap>` if you want a typed
event emitter for your own integration code.

## Disassembly

```ts
const { formatted, instructions } = assembler.disassemble();

console.log(formatted);
// instructions[i] = {
//   address, bytes, hexBytes, opCode, mode, args,
//   formattedArgs, formattedInstruction
// }
```

## Memory map

| Range | Use |
|-------|-----|
| `0x0000`–`0x00FF` | Zero page |
| `0x0100`–`0x01FF` | Stack |
| `0x0200`–`0x05FF` | Display memory (512 bytes) — see the exported `DisplayAddressRange` enum |
| `0x0600`+ | Program code (the assembler writes here; the CPU starts here) |
| `0xFF` | Last-keypress input cell (`memory.storeKeypress(value)`) |

## Utilities

A few helpers used throughout the engine are exported for convenience:

- `addr2hex(addr)` — format a 16-bit address as a hex string (e.g. `"0600"`).
- `num2hex(nr)` — format an 8-bit value as a hex string (e.g. `"2a"`).
- `hexToRgb(hex)` — parse a hex colour into normalized `{ red, green, blue }`.
- `throttle(fn, ms)` / `debounce(fn, ms)` — rate-limiters.
- `formatMessage(message, params)` — `%s` / `%d` / `%%` substitution.

## History

- Original implementation by **Stian Søreng** (2006–2010) — www.6502asm.com
- Adapted by **Nick Morgan** for the easy6502 tutorial — https://github.com/skilldrick/6502js
- Further adapted for [Learn 6502 Assembly](https://github.com/JumpLink/Learn6502), refactored into
  a typed, dependency-free, cross-runtime library and split into this `@learn6502/core` package.

## License

[GNU General Public License v3.0 only](https://www.gnu.org/licenses/gpl-3.0).
