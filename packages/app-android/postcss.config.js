module.exports = {
  plugins: [
    require("postcss-import"),
    require("@tailwindcss/postcss"),
    require("@nativescript/tailwind"),
    require("postcss-discard-empty"),
  ],
};
