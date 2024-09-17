import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import pkg from './package.json'

export default defineConfig(({ command, mode, ssrBuild }) => {

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)

  const applicationId = 'eu.jumplink.Easy6502'
  const resourcesPath = '/' + applicationId.replaceAll('.', '/') // E.g. /eu/jumplink/Easy6502
  const prefix = process.env.PREFIX || __dirname // E.g. /usr
  const libdir = process.env.LIBDIR || `${prefix}/lib` // E.g. /usr/lib
  const datadir = process.env.DATADIR || `${prefix}/data` // E.g. /usr/share
  const bindir = process.env.BINDIR || `${prefix}/bin` // E.g. /usr/bin
  return {
    define: {
      '__APPLICATION_ID__': JSON.stringify(applicationId),
      '__RESOURCES_PATH__': JSON.stringify(resourcesPath),
      '__VERSION__': JSON.stringify(pkg.version),
      '__PREFIX__': JSON.stringify(prefix),
      '__LIBDIR__': JSON.stringify(libdir),
      '__DATADIR__': JSON.stringify(datadir),
      '__BINDIR__': JSON.stringify(bindir),
    },
    css: {},
    build: {
      assetsDir: '.',
      outDir: 'bin',
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
          entryFileNames: applicationId,
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
