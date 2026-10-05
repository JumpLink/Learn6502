#!/usr/bin/env node
/**
 * Hold the About dialog's AppStream fallback against the real metainfo file.
 *
 * The fallback exists because `Adw.AboutDialog.new_from_appdata()` is absent
 * from the Windows libadwaita (gvsbuild patches the AppStream entry points out
 * with `#ifndef G_OS_WIN32`). It extracts a handful of fields by hand, which
 * means a restructured metainfo file can empty the About dialog on Windows and
 * macOS while every Linux build — where the upstream constructor is used and
 * the fallback never runs — stays perfectly green.
 *
 * That is the failure this guards: a defect visible only on the platforms CI
 * does not open a window on.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const METAINFO = join(
  root,
  "packages/app-gnome/data/metainfo/eu.jumplink.Learn6502.metainfo.xml"
);

// The same module the app ships — never a second copy of the regexes, or this
// check would pass while the shipped parser fails.
const { parseAppdata } = await import(
  join(root, "packages/app-gnome/src/appdata.ts")
);

/** Fields the About dialog must not be missing. `supportUrl` is optional: the
 *  metainfo has no `<url type="help">` today, and that is a legitimate state. */
const REQUIRED = [
  "applicationName",
  "developerName",
  "website",
  "issueUrl",
  "license",
];

const xml = await readFile(METAINFO, "utf8");
const fields = parseAppdata(xml);

const problems = [];
for (const key of REQUIRED) {
  if (!fields[key]) problems.push(`  ${key}: not found in ${METAINFO}`);
}

for (const [key, value] of Object.entries(fields)) {
  console.log(`  ${key.padEnd(16)} ${value === null ? "(none)" : value}`);
}

// The upstream constructor is localised — a German session gets "Lerne 6502
// Assembler". A fallback that always returned the untranslated <name> would
// ship an English title to every non-English user, and only on the platforms
// where the fallback runs, so nothing here would notice.
console.log("");
const TRANSLATED = ["de", "fr", "es", "nl"];
const source = parseAppdata(xml, ["C"]).applicationName;
let translations = 0;
for (const lang of TRANSLATED) {
  const localised = parseAppdata(xml, [`${lang}_XX.UTF-8`, lang, "C"]).applicationName;
  const differs = localised !== null && localised !== source;
  if (differs) translations++;
  console.log(`  name[${lang}]${" ".repeat(9)} ${localised ?? "(none)"}${differs ? "" : "   == source"}`);
}
if (translations === 0) {
  problems.push(
    `  applicationName is identical in all of ${TRANSLATED.join(", ")} — ` +
      "the translation lookup is not resolving"
  );
}

if (problems.length > 0) {
  console.error(`\nAbout dialog fallback would be incomplete:\n${problems.join("\n")}`);
  console.error(
    "\nThe fallback is in packages/app-gnome/src/appdata.ts — it runs on Windows\n" +
      "and macOS only, so no Linux run will tell you about this."
  );
  process.exit(1);
}

console.log(`\nAbout dialog fallback resolves all ${REQUIRED.length} required fields.`);
