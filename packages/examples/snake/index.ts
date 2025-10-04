import { default as snakeCode } from "./snake.asm?raw";
import snakeMeta from "./snake.meta.json";
import type { ExampleMeta } from "../example-meta.ts";
const snake: ExampleMeta = { ...snakeMeta, code: snakeCode };
export { snake };
