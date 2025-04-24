import { gettextPlugin, xgettextPlugin, po2jsonPlugin } from '@learn6502/vite-plugin-gettext';
import { readFileSync } from 'node:fs'

const APPLICATION_ID = 'eu.jumplink.Learn6502';
const VERSION = JSON.parse(readFileSync('./package.json', 'utf8')).version;

// Extract translatable strings from source files to create a POT template
const xgettext = xgettextPlugin({
  sources: [
    '../6502/src/**/*.{ts,tsx,js}',
    '../app-gnome/src/**/*.{ts,tsx,js,blp,xml,ui,desktop}',
    '../app-gnome/data/**/*.xml.in',
    '../learn/dist/**/*.ui'
  ],
  output: `./${APPLICATION_ID}.pot`,
  domain: APPLICATION_ID,
  preset: 'glib',
  verbose: true,
  version: VERSION,
  autoUpdatePo: true,
  msgidBugsAddress: 'https://github.com/JumpLink/Learn6502/issues'
});

// Compile PO files to MO files
const gettext = gettextPlugin({
  poDirectory: '.',
  moDirectory: './dist',
  filename: `${APPLICATION_ID}.mo`,
  verbose: true
});

// Convert PO files to JSON files
const po2json = po2jsonPlugin({
  poDirectory: '.',
  jsonDirectory: '../app-android/app/i18n',
  defaultLanguage: 'en',
  verbose: true,
  additionalTranslations: {
    // 'app.name' is a required key for the Android app
    'app.name': 'Learn 6502 Assembly'
  }
});

// Start the extraction process
await xgettext.buildStart();
// Start the compilation process
await gettext.buildStart();
// Start the conversion process
await po2json.buildStart();
