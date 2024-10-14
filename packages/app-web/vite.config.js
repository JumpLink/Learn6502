import { defineConfig } from 'vite'

export default defineConfig({
  clearScreen: false,
  css: {
    transformer: 'lightningcss',
  },
  build: {
    assetsDir: '.',
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: ['src/main.ts', 'src/main.css'],
      output: {
        // No hash in the filenames
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`,
      },
    },
    cssMinify: 'lightningcss',
  },
})
