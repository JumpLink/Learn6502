/**
 * NativeScript configuration — Android-only.
 *
 * Built with Vite 8 / Rolldown via @gjsify/nativescript-vite (vite.config.ts).
 * `@nativescript/vite` requires this file to be `nativescript.config.ts`.
 */
import type { NativeScriptConfig } from "@nativescript/core";

const loggingEnabled = !!process.env.NS_LOGGING;
const playStoreBuild = !!process.env.PLAY_STORE_BUILD;

export default {
  // Application identifier
  id: "eu.jumplink.Learn6502",

  // Paths
  appPath: "app",
  appResourcesPath: "data",

  // Bundler: Vite 8 / Rolldown via @gjsify/nativescript-vite (vite.config.ts
  // spreads defineNativescriptConfig()). Replaces the webpack build.
  bundler: "vite",
  bundlerConfigPath: "vite.config.ts",

  // Internationalization
  i18n: {
    defaultLanguage: "en",
  },

  // Android-specific configuration (no iOS - this is Android-only)
  android: {
    v8Flags: "--expose_gc",
    gradleVersion: "8.14.3",
    markingMode: "none",
    codeCache: true,
    handleTimeZoneChanges: true,
    ...(loggingEnabled
      ? {
          forceLog: true,
          maxLogcatObjectSize: 40096,
        }
      : {}),
  },

  // CSS parser
  cssParser: "rework",

  // Conditional dependencies
  ignoredNativeDependencies: playStoreBuild ? [] : ["@nativescript-community/sentry"],
} as NativeScriptConfig;
