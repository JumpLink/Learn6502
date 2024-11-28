import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { readFileSync, writeFileSync, chmodSync } from 'node:fs'
import pkg from './package.json'

import blueprintPlugin from '@easy6502/vite-plugin-blueprint'
import { xgettextPlugin, gettextPlugin } from '@easy6502/vite-plugin-gettext'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig(({ command, mode, ssrBuild }) => {

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  /*
   * The following environment variables are used to configure the build.
   * They are set by the meson build system which is used to build the project for flatpak.
   * If you do not use the meson build system, then path information points to the current
   * project structure in order to be able to execute the project locally without flatpak.
   */

  /**
   * flatpak+meson: eu.jumplink.Easy6502
   * local: eu.jumplink.Easy6502
   */
  const APPLICATION_ID = process.env.APPLICATION_ID || 'eu.jumplink.Easy6502'
  /**
   * flatpak+meson: <project-root>/_build/packages/app-gnome
   * local: <project-root>/packages/app-gnome/
   */
  const OUTDIR = process.env.OUTDIR || __dirname
  /**
   * flatpak and local: eu.jumplink.Easy6502
   */
  const ENTRY_FILENAME = process.env.ENTRY_FILENAME || APPLICATION_ID
  /**
   * flatpak and local: /eu/jumplink/Easy6502
   */
  const RESOURCES_PATH = '/' + APPLICATION_ID.replaceAll('.', '/')
  /**
   * flatpak and local: 0.1.0
   */
  const PACKAGE_VERSION = process.env.PACKAGE_VERSION || pkg.version
  /**
   * flatpak+meson: /usr
   * local: <project-root>/packages/app-gnome
   */
  const PREFIX = process.env.PREFIX || OUTDIR
  /**
   * flatpak+meson: /app/lib64
   * local: <project-root>/packages/app-gnome/lib
   */
  const LIBDIR = process.env.LIBDIR || `${PREFIX}/lib`
  /**
   * flatpak+meson: /app/share
   * local: <project-root>/packages/app-gnome/data
   */
  const DATADIR = process.env.DATADIR || `${PREFIX}/data`
  /**
   * flatpak+meson: /app/bin
   * local: <project-root>/packages/app-gnome
   */
  const BINDIR = process.env.BINDIR || PREFIX
  /**
   * flatpak+meson: /usr/bin/gjs-console
   * local: /usr/bin/env -S gjs
   */
  const GJS_CONSOLE = process.env.GJS_CONSOLE || '/usr/bin/env -S gjs'
  /**
   * flatpak+meson: /app/share/eu.jumplink.Easy6502
   * local: <project-root>/packages/app-gnome/data
   */
  const PKGDATADIR = process.env.PKGDATADIR || DATADIR

  /**
   * The build mode is used to determine if the build is a local build or a flatpak+meson build.
   * @type {'local' | 'flatpak'}
   */
  const BUILD_MODE = (process.env.BUILD_MODE || 'local')

  console.log({
    APPLICATION_ID,
    OUTDIR,
    ENTRY_FILENAME,
    RESOURCES_PATH,
    PACKAGE_VERSION,
    PREFIX,
    LIBDIR,
    DATADIR,
    BINDIR,
    GJS_CONSOLE,
    PKGDATADIR,
    BUILD_MODE
  })


  return {
    clearScreen: false,
    plugins: [
      blueprintPlugin({
        minify: true
      }),
      // Copy the MO files to the output directory for local builds
      // For flatpak builds, the MO files are compiled by meson
      BUILD_MODE === 'local' && viteStaticCopy({
        targets: [
          {
            src: '../translations/dist/locale',
            dest: DATADIR
          }
        ]
      }),
      {
        name: 'add-gjs-shebang',
        closeBundle: () => {
          const bundlePath = resolve(OUTDIR, `${APPLICATION_ID}`)
          const content = readFileSync(bundlePath, 'utf-8')
          const shebang = `#!${GJS_CONSOLE} -m\n`
          writeFileSync(bundlePath, shebang + content)
          chmodSync(bundlePath, '755') // Macht die Datei ausführbar
        }
      }
    ],
    define: {
      '__APPLICATION_ID__': JSON.stringify(APPLICATION_ID),
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
      outDir: OUTDIR,
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
          entryFileNames: ENTRY_FILENAME,
          // banner: `#!${GJS_CONSOLE} -m\n`,
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
