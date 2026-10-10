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
const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as { version: string };

// Load `.asm` example sources as plain-text default exports — the Vite mirror of
// the GNOME app's `gjsify` `loaders: { ".asm": "text" }`. The shared
// `@learn6502/examples` package does `import code from "./snake.asm"` to populate
// each example's `code`, so the Android build needs the same string loader.
function asmTextLoader(): Plugin {
  return {
    name: "learn6502-asm-text-loader",
    enforce: "pre",
    load(id) {
      const path = id.split("?")[0];
      if (!path.endsWith(".asm")) return null;
      return `export default ${JSON.stringify(readFileSync(path, "utf8"))};`;
    },
  };
}

export default defineNativescriptConfig(
  {},
  {
    // `.blp` files are imported as `?shared-tree`, the same Blueprint the GNOME app compiles.
    plugins: [asmTextLoader(), blueprintPlugin()],
    // Release minification must leave two things alone, or the app dies on launch:
    // - the default oxc minifier writes `extend(`com.tns.X`, …)` with a template literal and
    //   esbuild's syntax pass folds the `__decorate([JavaProxy("…")], t)` statements into comma
    //   expressions; the NativeScript static binding generator reads neither, so it silently
    //   skips `com.tns.FragmentClass`, `com.tns.NativeScriptActivity` and
    //   `org.nativescript.NativeScriptLifecycleCallbacks` and the runtime throws "Class not found".
    // - mangled class names break the `adw:Bin` → `AdwBin` check in @gjsify/adwaita-nativescript.
    build: { minify: "esbuild" },
    esbuild: { minifySyntax: false, keepNames: true },
    define: {
      DEV_LOG: JSON.stringify(devLog),
      PRODUCTION: JSON.stringify(production),
      PLAY_STORE_BUILD: JSON.stringify(playStoreBuild),
      __APP_ID__: JSON.stringify("eu.jumplink.Learn6502"),
      __APP_VERSION__: JSON.stringify(version),
    },
  }
);
