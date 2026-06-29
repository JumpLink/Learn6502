// Android types (no iOS - this app is Android-only)
/// <reference path="../../node_modules/@nativescript/types-android/lib/android-35.d.ts" />

// Theme switcher types
/// <reference path="../../node_modules/@nativescript/theme-switcher/shims.d.ts" />

// Raw file imports
declare module "*?raw" {
  const src: string;
  export default src;
}

// 6502 assembly example sources (loaded as text by the asmTextLoader Vite plugin;
// see vite.config.ts). Mirrors @learn6502/examples' own ambient declaration.
declare module "*.asm" {
  const content: string;
  export default content;
}

// Global build-time constants (set by Vite `define` in vite.config.ts; __ANDROID__/
// __IOS__ are provided by gjsifyNativescript()'s platform defines)

/** Development logging flag - true in development, false in production */
declare const DEV_LOG: boolean;

/** Production build flag */
declare const PRODUCTION: boolean;

/** Platform detection - always true in this Android-only app */
declare const __ANDROID__: boolean;

/** Platform detection - always false in this Android-only app */
declare const __IOS__: boolean;

/** Play Store build flag - used for conditional features */
declare const PLAY_STORE_BUILD: boolean;

/** Application ID - matches the id from nativescript.config.js */
declare const __APP_ID__: string;

/** Application version - injected from package.json at build time */
declare const __APP_VERSION__: string;
