import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const root = resolve(import.meta.dirname, "../..");
const manifest = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8")) as {
  gjsify?: { site?: { base?: string } };
};
const base = manifest.gjsify?.site?.base;
if (!base) throw new Error('The root package.json has no "gjsify.site.base"');

// Only the client script and stylesheet go through Vite; the HTML is rendered by `src/cli.ts build`.
export default defineConfig({
  base,
  build: {
    manifest: true,
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: { input: resolve(import.meta.dirname, "src/client/main.ts") },
  },
  preview: { open: false },
});
