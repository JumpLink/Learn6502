// NativeScript build config (Vite 8 / Rolldown) via the @gjsify/nativescript-vite
// composer. `defineNativescriptConfig` composes @nativescript/vite, fixes the two
// constructs Vite 8 / Rolldown reject, and layers gjsify's NativeScript transforms
// (gi://→empty, platform resolution, __ANDROID__/__IOS__/__DEV__ defines,
// node-builtin aliases, css-tree→bundled-dist). Replaces webpack.config.js.
//
// The second arg ports the webpack `DefinePlugin` constants. `__ANDROID__` /
// `__IOS__` are already provided by gjsifyNativescript()'s platform defines, and
// `?raw` imports are native in Vite — so neither needs porting here.
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import blueprintPlugin from "@gjsify/vite-plugin-blueprint";
import { defineNativescriptConfig } from "@gjsify/nativescript-vite";

const production = process.env.NODE_ENV === "production" || !!process.env.PRODUCTION;
const devLog = !production && !process.env.NO_DEV_LOG;
const playStoreBuild = !!process.env.PLAY_STORE_BUILD;
// The `__GJSIFY_CHANNEL__` define `gjsify build --channel` sets, for @gjsify/distribution. The APK
// from the project's own site is `web` (ADR 0113); a Play build declares none, so it shows no
// donation UI until a Play channel exists.
const channel = playStoreBuild ? undefined : (process.env.GJSIFY_CHANNEL ?? "web");
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// Load `.asm` example sources and `@learn6502/ui`'s GtkSourceView `.lang` / `.xml` data as
// plain-text default exports — the Vite mirror of the GNOME app's `gjsify`
// `loaders: { ".asm": "text", … }`. The shared `@learn6502/examples` package does
// `import code from "./snake.asm"`, `@learn6502/ui` does `import lang from "./x.lang"`. `.xml`
// is limited to the ui GtkSourceView data: NativeScript's own XML views and the `?schema` import
// must keep their pipelines.
function asmTextLoader(): Plugin {
  return {
    name: "learn6502-asm-text-loader",
    enforce: "pre",
    load(id) {
      const path = id.split("?")[0];
      const isUiData = /\/ui\/data\/(lang-specs|styles)\/.*\.xml$/.test(path) || path.endsWith(".lang");
      if (!path.endsWith(".asm") && !isUiData) return null;
      return `export default ${JSON.stringify(readFileSync(path, "utf8"))};`;
    },
  };
}

export default defineNativescriptConfig(
  { giRenderer: true },
  {
    // `.blp` files are imported as `?shared-tree` (the editor widget) or `?template` (the shared
    // `@learn6502/ui` components, whose GObject classes `--gi-renderer` runs on NativeScript).
    plugins: [asmTextLoader(), blueprintPlugin({ template: { renderer: "adwaita-nativescript" } })],
    define: {
      DEV_LOG: JSON.stringify(devLog),
      PRODUCTION: JSON.stringify(production),
      PLAY_STORE_BUILD: JSON.stringify(playStoreBuild),
      __APP_ID__: JSON.stringify("eu.jumplink.Learn6502"),
      __APP_VERSION__: JSON.stringify(version),
      ...(channel ? { __GJSIFY_CHANNEL__: JSON.stringify(channel) } : {}),
    },
  }
);
