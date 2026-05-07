/// <reference path="./vite-env.d.ts" />

import "@gjsify/vite-plugin-blueprint/src/type.d.ts";

// Declare global variables defined by `gjsify build` via
// `defineFromEnv` / `defineFromPackageJson` in package.json#gjsify
declare global {
  /** eu.jumplink.Learn6502 */
  const __APPLICATION_ID__: string;
  /** /eu/jumplink/Learn6502 */
  const __RESOURCES_PATH__: string;
  /** e.g. 0.6.5 */
  const __PACKAGE_VERSION__: string;
  /** /usr */
  const __PREFIX__: string;
  /** /usr/lib */
  const __LIBDIR__: string;
  /** /usr/share */
  const __DATADIR__: string;
  /** /usr/bin */
  const __BINDIR__: string;
  /** #!/usr/bin/env -S gjs -m */
  const __GJS_CONSOLE__: string;
  const __PKGDATADIR__: string;
}

// File loaders for gjsify build (configured via `loaders` in
// package.json#gjsify and the built-in `cssAsStringPlugin`).
declare module "*.ui" {
  const content: string;
  export default content;
}
declare module "*.asm" {
  const content: string;
  export default content;
}
declare module "*.css" {
  const content: string;
  export default content;
}

// This empty export is necessary to make this a module
export {};
