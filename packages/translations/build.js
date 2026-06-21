import { gettextPlugin, xgettextPlugin, po2jsonPlugin } from "@gjsify/vite-plugin-gettext";
import { readFileSync } from "node:fs";

const APPLICATION_ID = "eu.jumplink.Learn6502";
const VERSION = JSON.parse(readFileSync("./package.json", "utf8")).version;

// Extract translatable strings from source files to create a POT template
const xgettext = xgettextPlugin({
  sources: [
    "../6502/src/**/*.{ts,tsx,js}",
    "../common-ui/src/**/*.{ts,tsx,js}",
    "../app-gnome/src/**/*.{ts,tsx,js,blp,xml,ui,desktop}",
    "../app-gnome/data/**/*.xml.in",
    "../examples/**/*.ts",
    "../learn/dist/**/*.ui",
  ],
  output: `./${APPLICATION_ID}.pot`,
  domain: APPLICATION_ID,
  preset: "glib",
  verbose: true,
  version: VERSION,
  autoUpdatePo: true,
  msgidBugsAddress: "https://github.com/JumpLink/Learn6502/issues",
  // Reduce diff noise and stabilize output
  noLocation: true,
  sortOutput: true,
  // Preserve existing POT-Creation-Date from previous POT
  preserveCreationDate: true,
  // Disable line wrapping to keep long lines intact and avoid Weblate conflicts
  noWrap: true,
});

// Compile PO files to MO files
const gettext = gettextPlugin({
  poDirectory: ".",
  moDirectory: "./dist",
  filename: `${APPLICATION_ID}.mo`,
  verbose: true,
});

// Convert PO files to JSON files
const po2json = po2jsonPlugin({
  poDirectory: ".",
  jsonDirectory: "../app-android/app/i18n",
  defaultLanguage: "en",
  verbose: true,
  additionalTranslations: {
    // 'app.name' is a required key for the Android app
    "app.name": "Learn 6502 Assembly",
  },
});

// Start the extraction process
await xgettext.buildStart();
// Start the compilation process
await gettext.buildStart();
// Start the conversion process
await po2json.buildStart();

// Force a clean exit. Under GJS the gettext plugins' `Gio.Subprocess` calls
// (xgettext/msgfmt) leave the GLib main loop armed, so this one-shot generator
// would not exit on its own — and a node-free `gjsify workspace` build would
// hang waiting for it. On Node the event loop is already empty, so this is just
// an immediate clean exit after all work is done.
globalThis.process?.exit?.(0);
