// Emit dist-app/index.html for the production `gjsify build --app browser`
// bundle (dist-app/app.js). Unlike a Vite build, the gjsify CLI produces only
// the JS bundle, so the shell page that loads it is written here. All CSS
// (adwaita-web skin, shell layout, debugger widgets) is self-injected by the
// bundle at runtime, so the page needs nothing but the module script.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const distApp = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist-app');
mkdirSync(distApp, { recursive: true });

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>Learn 6502 Assembly — Adwaita SPA (Phase 1)</title>
  </head>
  <body>
    <script type="module" src="./app.js"></script>
  </body>
</html>
`;

writeFileSync(join(distApp, 'index.html'), html);
console.log('[app-web] wrote dist-app/index.html');
