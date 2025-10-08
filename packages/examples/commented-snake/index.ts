import { default as commentedSnakeCode } from "./commented-snake.asm?raw";
import commentedSnakeMeta from "./commented-snake.meta.ts";
import type { ExampleMeta } from "../example-meta.ts";
const commentedSnake: ExampleMeta = {
  ...commentedSnakeMeta,
  code: commentedSnakeCode,
};
export { commentedSnake };
