import { default as snakeCode } from "./snake/snake.asm";
import snakeMeta from "./snake/snake.meta.json";
import type { ExampleMeta } from "./example-meta.ts";
const snake: ExampleMeta = { ...snakeMeta, code: snakeCode };
export { snake };
