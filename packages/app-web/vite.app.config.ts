import { defineConfig } from "vite";
import { gjsifyBrowser } from "@gjsify/vite-plugin-gjsify";

// Dev-server config for the new Adwaita SPA shell (`app.html` → src/app/main.ts).
//
// This is a SEPARATE config from `vite.config.js` on purpose: that one builds
// the classic Jekyll site's assets (src/main.ts + src/main.css → dist/) and is
// consumed by the Jekyll templates, so it must stay byte-identical. This config
// only powers `dev:app` / `preview:app`; production is built with
// `gjsify build --app browser` (the `build:app` script), and `preview:app`
// serves that output from `dist-app/`.
//
// `gjsifyBrowser()` mirrors what `gjsify build --app browser` produces, so the
// dev experience matches the shipped bundle (minus css-as-string, which a real
// browser app wants routed through Vite's native CSS pipeline).
export default defineConfig({
  // `cssAsString: true` makes `import css from './x.css'` yield the CSS string
  // in dev (matching `gjsify build --app browser`), so the shell + widget
  // styles apply identically dev/prod via a <style> element.
  plugins: [...gjsifyBrowser({ cssAsString: true })],
  server: { open: "/app.html" },
  build: {
    outDir: "dist-app",
    rollupOptions: { input: "app.html" },
  },
});
