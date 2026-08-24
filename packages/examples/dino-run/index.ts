import { default as dinoRunCode } from "./dino-run.asm";
import dinoRunMeta from "./dino-run.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const dinoRun: ExampleMeta = {
  ...dinoRunMeta,
  code: dinoRunCode,
};
export { dinoRun };
