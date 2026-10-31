import { describe, it, expect } from "@gjsify/unit";
import { Assembler } from "./assembler.js";
import { Labels } from "./labels.js";
import { Memory } from "./memory.js";
import { Simulator } from "./simulator.js";

const C = 0x01;
const Z = 0x02;
const V = 0x40;
const N = 0x80;

/** Assembles `code`, runs `steps` instructions and returns A and the set flags as "A=20 CZ". */
const run = (code: string, steps: number, setup: (memory: Memory) => void = () => {}) => {
  const memory = new Memory();
  const labels = new Labels();
  const assembler = new Assembler(memory, labels);
  const simulator = new Simulator(memory, labels);
  simulator.reset();
  setup(memory);
  expect(assembler.assembleCode(code)).toBe(true);
  for (let i = 0; i < steps; i++) simulator.debugExecStep();
  const { regA, regP } = simulator.info;
  const flags = (regP & C ? "C" : "") + (regP & Z ? "Z" : "") + (regP & N ? "N" : "") + (regP & V ? "V" : "");
  return `A=${regA.toString(16).padStart(2, "0")} ${flags}`;
};

/** SBC $10 (0xE5) with A and the memory operand given, carry set or clear beforehand. */
const sbcZeroPage = (carry: boolean, a: number, operand: number) =>
  run(`${carry ? "SEC" : "CLC"}\nLDA #$${a.toString(16)}\nSBC $10`, 3, (m) => m.set(0x10, operand));

/** SBC ($20,X) (0xE1) reading the operand from $0300 via the pointer at $20/$21. */
const sbcIndirectX = (carry: boolean, a: number, operand: number) =>
  run(`${carry ? "SEC" : "CLC"}\nLDX #$00\nLDA #$${a.toString(16)}\nSBC ($20,X)`, 4, (m) => {
    m.set(0x20, 0x00);
    m.set(0x21, 0x03);
    m.set(0x0300, operand);
  });

export default () => {
  describe("SBC zero page (0xE5)", () => {
    it("subtracts without borrow and keeps carry set", () => {
      expect(sbcZeroPage(true, 0x50, 0x30)).toBe("A=20 C");
    });
    it("subtracts with borrow, clears carry and sets negative", () => {
      expect(sbcZeroPage(true, 0x30, 0x50)).toBe("A=e0 N");
    });
    it("sets zero when the result is 0", () => {
      expect(sbcZeroPage(true, 0x40, 0x40)).toBe("A=00 CZ");
    });
    it("sets overflow on signed overflow", () => {
      expect(sbcZeroPage(true, 0x50, 0xb0)).toBe("A=a0 NV");
    });
    it("subtracts the extra borrow when carry is clear", () => {
      expect(sbcZeroPage(false, 0x50, 0x30)).toBe("A=1f C");
    });
  });

  describe("SBC (zp,X) (0xE1)", () => {
    it("subtracts without borrow and keeps carry set", () => {
      expect(sbcIndirectX(true, 0x50, 0x30)).toBe("A=20 C");
    });
    it("subtracts with borrow, clears carry and sets negative", () => {
      expect(sbcIndirectX(true, 0x30, 0x50)).toBe("A=e0 N");
    });
    it("sets zero when the result is 0", () => {
      expect(sbcIndirectX(true, 0x40, 0x40)).toBe("A=00 CZ");
    });
    it("sets overflow on signed overflow", () => {
      expect(sbcIndirectX(true, 0x50, 0xb0)).toBe("A=a0 NV");
    });
    it("subtracts the extra borrow when carry is clear", () => {
      expect(sbcIndirectX(false, 0x50, 0x30)).toBe("A=1f C");
    });
  });
};
