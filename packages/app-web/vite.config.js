import { defineConfig } from 'vite'

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  build: {
    assetsDir: '.',
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      input: 'src/main.ts',
      output: {
        entryFileNames: 'main.js',
      },
    },
    cssMinify: 'lightningcss',
  },
})
