import { default as testCode } from "./test.asm?raw";
import testMeta from "./test.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const test: ExampleMeta = { ...testMeta, code: testCode };
export { test };
