import mdx from "@mdx-js/esbuild";
import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["tsx/index.tsx"],
  format: "esm",
  outdir: "dist",
  platform: "node",
  plugins: [mdx({ jsxImportSource: "nano-jsx/esm" })],
  loader: {
    ".asm": "text",
  },
  bundle: true,
});
