// Types for both iOS and Android
// We do not need this because we only build the app for Android here
//// <reference path="../../node_modules/@nativescript/types/index.d.ts" />

// Android types
/// <reference path="../../node_modules/@nativescript/types-android/lib/android-35.d.ts" />

// Theme switcher types
/// <reference path="../../node_modules/@nativescript/theme-switcher/shims.d.ts" />

declare module '*?raw' {
    const src: string
    export default src
  }
