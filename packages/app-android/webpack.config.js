const webpack = require("@nativescript/webpack");

module.exports = (env) => {
  webpack.init(env);

  // Learn how to customize:
  // https://docs.nativescript.org/webpack

  // Add rule for raw imports with ?raw suffix
  webpack.chainWebpack((config) => {
    config.module
      .rule("raw")
      .resourceQuery(/raw/)
      .use("raw-loader")
      .loader("raw-loader")
      .end();
  });

  return webpack.resolveConfig();
};
