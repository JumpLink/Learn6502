// File loader for `gjsify build`: `*.asm` is claimed by the text-loader plugin
// (configured via `loaders` in package.json#gjsify, mirroring app-gnome's
// `*.asm` loader). It produces a JS string default export — used when
// `@learn6502/examples` imports each example's `*.asm` source as a string.
//
// This ambient module declaration lives in a non-module file (no top-level
// import/export) so `declare module "*.asm"` is treated globally rather than
// as a local module-augmentation scope.
declare module "*.asm" {
  const content: string;
  export default content;
}
