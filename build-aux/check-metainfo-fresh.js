#!/usr/bin/env node
/**
 * The tracked metainfo `.xml` must be what the `.xml.in` template renders to.
 *
 * `gjsify build` of app-gnome renders the template through `msgfmt --xml`
 * (the `msgfmtPlugin` in packages/app-gnome/package.json) and strips comments,
 * but the result is a TRACKED file by hand: the landing page (`site.metainfo`),
 * the Meson install and `check:metainfo` all read the `.xml`, never the
 * template. The 0.9.1 release entry went into the template only, so the site
 * said "Changes in version 0.9.0" and the Flatpak shipped stale notes.
 *
 * Run with `--write` to regenerate the tracked file; without it the script
 * only compares. It repeats the plugin's two steps, so keep them in step.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = "packages/app-gnome/data/metainfo";
const template = `${dir}/eu.jumplink.Learn6502.metainfo.xml.in`;
const tracked = `${dir}/eu.jumplink.Learn6502.metainfo.xml`;
const write = process.argv.includes("--write");

const tmp = mkdtempSync(join(tmpdir(), "metainfo-"));
try {
  const out = join(tmp, "metainfo.xml");
  execFileSync("msgfmt", [`--output-file=${out}`, "--xml", `--template=${template}`, "-d", "packages/translations"]);
  const fresh = readFileSync(out, "utf8").replace(/<!--[\s\S]*?-->/g, "");

  if (write) {
    writeFileSync(tracked, fresh);
    console.log(`regenerated ${tracked}`);
  } else if (readFileSync(tracked, "utf8") !== fresh) {
    console.error(
      `${tracked} is stale against ${template}.\n` +
        "Regenerate it: gjsify run metainfo:regen — and commit the result.",
    );
    process.exit(1);
  } else {
    console.log("metainfo .xml matches its template");
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
