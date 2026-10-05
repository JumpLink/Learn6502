import { default as lineBuster6502Code } from "./line-buster-6502.asm";
import lineBuster6502Meta from "./line-buster-6502.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const lineBuster6502: ExampleMeta = {
  ...lineBuster6502Meta,
  code: lineBuster6502Code,
};
export { lineBuster6502 };
