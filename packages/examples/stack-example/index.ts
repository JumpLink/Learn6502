import { default as stackExampleCode } from "./stack-example.asm";
import stackExampleMeta from "./stack-example.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const stackExample: ExampleMeta = { ...stackExampleMeta, code: stackExampleCode };
export { stackExample };
