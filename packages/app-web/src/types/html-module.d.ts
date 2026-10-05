// File loader for `gjsify build`: `*.html` is claimed by the text-loader
// plugin (configured via `loaders` in package.json#gjsify, mirroring
// app-gnome's `*.ui`/`*.asm` loaders). It produces a JS string default
// export — used to import `@learn6502/learn`'s generated tutorial/quick-help
// HTML fragments as plain strings to mount into the DOM.
//
// This ambient module declaration lives in a non-module file (no top-level
// import/export) so `declare module "*.html"` is treated globally rather
// than as a local module-augmentation scope.
declare module "*.html" {
  const content: string;
  export default content;
}
