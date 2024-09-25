import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import pkg from './package.json'

export default defineConfig(({ command, mode, ssrBuild }) => {

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const APP_ID = process.env.APP_ID || 'eu.jumplink.Easy6502'
  const RESOURCES_PATH = '/' + APP_ID.replaceAll('.', '/') // E.g. /eu/jumplink/Easy6502
  const PACKAGE_VERSION = process.env.PACKAGE_VERSION || pkg.version
  const PREFIX = process.env.PREFIX || __dirname // E.g. /usr
  const LIBDIR = process.env.LIBDIR || `${PREFIX}/lib` // E.g. /usr/lib
  const DATADIR = process.env.DATADIR || `${PREFIX}/share` // E.g. /usr/share
  const BINDIR = process.env.BINDIR || `${PREFIX}/bin` // E.g. /usr/bin
  const GJS_CONSOLE = process.env.GJS_CONSOLE || `#!/usr/bin/env -S gjs`
  const PKGDATADIR = process.env.PKGDATADIR || `${DATADIR}/${APP_ID}`

  return {
    plugins: [],
    define: {
      '__APP_ID__': JSON.stringify(APP_ID),
      '__RESOURCES_PATH__': JSON.stringify(RESOURCES_PATH),
      '__PACKAGE_VERSION__': JSON.stringify(PACKAGE_VERSION),
      '__PREFIX__': JSON.stringify(PREFIX),
      '__LIBDIR__': JSON.stringify(LIBDIR),
      '__DATADIR__': JSON.stringify(DATADIR),
      '__BINDIR__': JSON.stringify(BINDIR),
      '__GJS_CONSOLE__': JSON.stringify(GJS_CONSOLE),
      '__PKGDATADIR__': JSON.stringify(PKGDATADIR),
    },
    css: {},
    build: {
      assetsDir: '.',
      outDir: 'bin',
      emptyOutDir: false,
      // target: "firefox60", // Since GJS 1.53.90
      // target: "firefox68", // Since GJS 1.63.90
      // target: "firefox78", // Since GJS 1.65.90
      // target: "firefox91", // Since GJS 1.71.1
      // target: "firefox102", // Since GJS 1.73.2
      target: "firefox115", // Since GJS 1.77.2
      minify: false,
      rollupOptions: {
        input: 'src/main.ts',
        output: {
          entryFileNames: APP_ID,
          banner: `#!${GJS_CONSOLE} -m\n`,
        },
        external: [new RegExp('^gi://*', 'i'), 'system'],
      },
      esbuild: {
        external: ['jsdom', 'react'],
        loader: {
          '.ui': 'text',
        },
      },
      cssMinify: false
    }
  }
})
