/**
 * NativeScript configuration
 *
 * Extended configuration following best practices from reference projects
 * (conty, oss-weather). This app is Android-only.
 */

// Build configuration from environment
const loggingEnabled = !!process.env.NS_LOGGING;
const playStoreBuild = !!process.env.PLAY_STORE_BUILD;

module.exports = {
  // Application identifier
  id: "eu.jumplink.Learn6502",

  // Paths
  appPath: "app",
  appResourcesPath: "data",

  // Internationalization
  i18n: {
    defaultLanguage: "en",
  },

  // Android-specific configuration (no iOS - this is Android-only)
  android: {
    // V8 flags for better memory management
    v8Flags: "--expose_gc",

    // Use recommended Gradle version
    gradleVersion: "8.14.3",

    // Memory management
    markingMode: "none",

    // Enable code caching for faster startup
    codeCache: true,

    // Handle timezone changes properly
    handleTimeZoneChanges: true,

    // Logging configuration
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
  ignoredNativeDependencies: [].concat(
    playStoreBuild ? [] : ["@nativescript-community/sentry"]
  ),
};
