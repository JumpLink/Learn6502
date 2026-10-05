/// <reference path="./vite-env.d.ts" />

// Declare global variables defined by `gjsify build` via
// `defineFromEnv` / `defineFromPackageJson` in package.json#gjsify
declare global {
  /** eu.jumplink.Learn6502 */
  const __APPLICATION_ID__: string;
  /** /eu/jumplink/Learn6502 */
  const __RESOURCES_PATH__: string;
  /** e.g. 0.7.0 */
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

  /**
   * The bundle's own `import.meta.url`, set by `gjsify build` on the first line
   * of every bundle it writes. `var` rather than `const` because it is assigned
   * at run time (`globalThis.__gjsifyBundleUrl ??= import.meta.url`) and absent
   * when the sources are loaded unbundled.
   */
  var __gjsifyBundleUrl: string | undefined;
}

// This empty export is necessary to make this a module
export {};
