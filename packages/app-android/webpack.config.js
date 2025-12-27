const webpack = require("@nativescript/webpack");
const { DefinePlugin } = require("webpack");

// Build configuration flags from environment
const production =
  process.env.NODE_ENV === "production" || !!process.env.PRODUCTION;
const devLog = !production && !process.env.NO_DEV_LOG;
const playStoreBuild = !!process.env.PLAY_STORE_BUILD;

// Get app ID from nativescript.config.js
const nativescriptConfig = require("./nativescript.config.js");
const appId = nativescriptConfig.id;

module.exports = (env) => {
  // Register Android activity as app component
  // This ensures NativeScript loads the activity class
  env.appComponents = env.appComponents || [];
  env.appComponents.push("~/android/activity.android");

  webpack.init(env);

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  webpack.chainWebpack((config) => {
    // Add rule for raw imports with ?raw suffix
    config.module
      .rule("raw")
      .resourceQuery(/raw/)
      .use("raw-loader")
      .loader("raw-loader")
      .end();

    // Define global constants following the pattern from reference projects
    // These are replaced at compile time by webpack's DefinePlugin
    config.plugin("define").use(DefinePlugin, [
      {
        // Development logging - use: DEV_LOG && console.log('message')
        DEV_LOG: JSON.stringify(devLog),
        // Production flag
        PRODUCTION: JSON.stringify(production),
        // Platform detection (Android-only app)
        __ANDROID__: JSON.stringify(true),
        __IOS__: JSON.stringify(false),
        // Play Store build flag for conditional features
        PLAY_STORE_BUILD: JSON.stringify(playStoreBuild),
        // Application ID (used for package references)
        __APP_ID__: JSON.stringify(appId),
      },
    ]);

    // Add string-replace-loader to replace __PACKAGE__ with app ID
    // This follows the pattern from reference projects (conty, oss-weather)
    // __PACKAGE__ is replaced in .ts, .js, .scss, .css files
    // Note: XML files (like AndroidManifest.xml) are processed separately by NativeScript build system
    config.module
      .rule("string-replace-package")
      .test(/\.(ts|js|scss|css)$/)
      .exclude.add(/node_modules/)
      .end()
      .use("string-replace-loader")
      .loader("string-replace-loader")
      .options({
        search: "__PACKAGE__",
        replace: appId,
        flags: "g",
      });
  });

  return webpack.resolveConfig();
};
