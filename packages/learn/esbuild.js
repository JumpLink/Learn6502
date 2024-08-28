import mdx from '@mdx-js/esbuild'
import esbuild from 'esbuild'

await esbuild.build({
  // Replace `index.js` with your entry point that imports MDX files:
  entryPoints: ['src/index.ts'],
  target: "firefox115", // Since GJS 1.77.2
  format: 'esm',
  outdir: 'dist',
  plugins: [mdx({/* jsxImportSource: …, otherOptions… */})],
  bundle: true,
  external: ['gi://*', 'resource://*', 'gettext', 'system', 'cairo'],
})