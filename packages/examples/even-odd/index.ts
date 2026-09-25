import { default as evenOddCode } from "./even-odd.asm";
import evenOddMeta from "./even-odd.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const evenOdd: ExampleMeta = {
  ...evenOddMeta,
  code: evenOddCode,
};
export { evenOdd };
