import { gettextPlugin, xgettextPlugin, po2jsonPlugin } from "@gjsify/vite-plugin-gettext";
import { existsSync, readFileSync } from "node:fs";

const APPLICATION_ID = "eu.jumplink.Learn6502";
const VERSION = JSON.parse(readFileSync("./package.json", "utf8")).version;

/**
 * Extraction sources that are another package's build output, not source.
 *
 * `../learn/dist/*.ui` holds the tutorial rendered from `tutorial.mdx`, and it
 * carries 219 of the 457 strings in the POT — every paragraph of the tutorial.
 * Because it is a build artifact, `xgettext` reads whatever the last run of
 * `@learn6502/learn` happened to leave behind: with the directory missing the
 * glob simply matches nothing, extraction succeeds, and the POT plus all 16
 * catalogs are rewritten without the tutorial. That happened on 2026-09-03 —
 * the build exited 0, and `check` passed over the gutted catalogs, because a
 * string that is gone is a string no rule can look at.
 *
 * The ordering fix is the first step of this package's `build` in
 * `package.json`, which builds its only workspace dependency before extraction
 * runs. The assertion below is the second half: it makes the same mistake loud
 * for anyone who runs the extraction on its own, instead of silently emptying
 * the catalogs.
 *
 * The assertion is on content, not on the file being there. A `.ui` that exists
 * but carries no `translatable="yes"` property reproduces the 2026-09-03
 * collapse exactly — measured: with both files truncated to zero bytes the POT
 * goes from 457 msgids to 238 and 259 strings go obsolete in `de.po`, and an
 * existence check passes over it. Freshness is not what is being asserted here
 * (an mtime would only say when a file was written, which a CI cache restores
 * anyway); what is asserted is that the extraction has something to extract.
 */
const GENERATED_SOURCES = {
  "@learn6502/learn": ["../learn/dist/tutorial.ui", "../learn/dist/quick-help.ui"],
};

/** The attribute `xgettext` keys on when it reads a GtkBuilder file. */
const TRANSLATABLE = 'translatable="yes"';

for (const [workspace, artifacts] of Object.entries(GENERATED_SOURCES)) {
  const unusable = artifacts
    .map((path) => {
      if (!existsSync(path)) return `${path} is missing`;
      if (!readFileSync(path, "utf8").includes(TRANSLATABLE)) return `${path} carries no translatable strings`;
      return null;
    })
    .filter((problem) => problem !== null);
  if (unusable.length)
    throw new Error(
      `Cannot extract translatable strings: ${unusable.join(", ")}. ` +
        `Run \`gjsify workspace ${workspace} build\` first, or use \`gjsify workspace @learn6502/translations build\`, ` +
        `which does it for you.`
    );
}

// Extract translatable strings from source files to create a POT template
const xgettext = xgettextPlugin({
  sources: [
    "../core/src/**/*.{ts,tsx,js}",
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
