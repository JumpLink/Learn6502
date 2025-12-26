// Android types (no iOS - this app is Android-only)
/// <reference path="../../node_modules/@nativescript/types-android/lib/android-35.d.ts" />

// Material Design 3 types (not included in @nativescript/types-android)
/// <reference path="app/typings/material.android.d.ts" />

// Theme switcher types
/// <reference path="../../node_modules/@nativescript/theme-switcher/shims.d.ts" />

// Raw file imports
declare module "*?raw" {
  const src: string;
  export default src;
}

// Global build-time constants (set by webpack DefinePlugin)
// These follow the pattern from reference projects (conty, oss-weather)

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
