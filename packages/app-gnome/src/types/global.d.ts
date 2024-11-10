/// <reference path="./vite-env.d.ts" />
/// <reference types="vite/client" />

import "@easy6502/vite-plugin-blueprint/src/type.d.ts"

// Declare global variables defined by vite.config.js
declare global {
  /** eu.jumplink.Easy6502 */
  const __APPLICATION_ID__: string
  /** /eu/jumplink/Easy6502 */
  const __RESOURCES_PATH__: string
  /** 0.1.0 */
  const __PACKAGE_VERSION__: string
  /** /usr */
  const __PREFIX__: string
  /** /usr/lib */
  const __LIBDIR__: string
  /** /usr/share */
  const __DATADIR__: string
  /** /usr/bin */
  const __BINDIR__: string
  /** #!/usr/bin/env -S gjs -m */
  const __GJS_CONSOLE__: string
  const __PKGDATADIR__: string
}

// This empty export is necessary to make this a module
export {}
