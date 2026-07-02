import { defineConfig } from "vite";

// Dev-only build for the ADR 0007 DebuggerView spike (debugger-spike.html).
//
// This is a SEPARATE config on purpose: the main build is consumed by the
// Jekyll site through classic (non-module) <script> tags, so it must stay a
// single self-contained chunk. Adding the spike page as a second entry to the
// main config would split shared modules into an extra chunk loaded via
// `import` — which a classic script cannot execute. Building the spike into
// its own output dir keeps the published site byte-identical.
//
// The dev server does not need this config (no bundling): `npx vite` serves
// /debugger-spike.html directly.
export default defineConfig({
  clearScreen: false,
  css: {
    transformer: "lightningcss",
  },
  build: {
    outDir: "dist-spike",
    minify: false,
    rollupOptions: {
      input: ["debugger-spike.html"],
    },
    cssMinify: "lightningcss",
  },
});
