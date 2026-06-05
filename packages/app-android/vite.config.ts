// NativeScript build config (Vite 8 / Rolldown) via the @gjsify/nativescript-vite
// composer. `defineNativescriptConfig` composes @nativescript/vite, fixes the two
// constructs Vite 8 / Rolldown reject, and layers gjsify's NativeScript transforms
// (gi://→empty, platform resolution, __ANDROID__/__IOS__/__DEV__ defines,
// node-builtin aliases, css-tree→bundled-dist). Replaces webpack.config.js.
//
// The second arg ports the webpack `DefinePlugin` constants. `__ANDROID__` /
// `__IOS__` are already provided by gjsifyNativescript()'s platform defines, and
// `?raw` imports are native in Vite — so neither needs porting here.
import { defineNativescriptConfig } from "@gjsify/nativescript-vite";

const production = process.env.NODE_ENV === "production" || !!process.env.PRODUCTION;
const devLog = !production && !process.env.NO_DEV_LOG;
const playStoreBuild = !!process.env.PLAY_STORE_BUILD;

export default defineNativescriptConfig(
  {},
  {
    define: {
      DEV_LOG: JSON.stringify(devLog),
      PRODUCTION: JSON.stringify(production),
      PLAY_STORE_BUILD: JSON.stringify(playStoreBuild),
      __APP_ID__: JSON.stringify("eu.jumplink.Learn6502"),
    },
  }
);
