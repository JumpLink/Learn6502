import { default as snakeCode } from "./snake.asm";
import snakeMeta from "./snake.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const snake: ExampleMeta = {
  ...snakeMeta,
  code: snakeCode,
};
export { snake };
