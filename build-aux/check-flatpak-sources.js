/**
 * `gjsify-sources.json` has to cover what `gjsify install --focus` takes from
 * `gjsify-lock.json`, or the Flatpak build
 * fails inside the sandbox where nobody is watching.
 *
 * The Flathub build has no network. `flatpak-builder` pre-populates a cache
 * from the `sources` array, and the root `meson.build` then runs
 * `gjsify install --immutable --focus` against that cache. `--immutable` installs
 * exactly what the lockfile pins, so a tarball the focused install names and the
 * sources array does not is a download that cannot happen — the build dies at
 * `meson.build:23` with nothing but "failed with status 1", because Meson
 * captures the output of a `run_command` it declared `check: true`.
 *
 * The two files are generated from each other and still come apart, because
 * they are re-cut by two different commands: anything that touches the
 * dependency graph rewrites the lockfile, and only `gjsify flatpak sources`
 * rewrites the sources. Add a dependency, run `gjsify install`, forget the
 * second command, and every local check still passes — the tree builds, the
 * types check, the tests run. Only the Flatpak job sees it, twenty minutes
 * later. That happened on this branch: seven runtime packages and
 * `node-addon-api` were added after the sources had been cut, and the job
 * failed with exactly that unhelpful message.
 *
 * Comparison is by tarball URL rather than by package name: the lockfile keys
 * on install PATH, so one package can appear under several of them, and the
 * sources array is deduplicated. What the cache is addressed by is the tarball.
 */

import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The Flatpak build installs with `--focus`, so the cache only has to hold what
// that workspace needs. Ask the same command that cut the sources what it
// would pick today, rather than re-deriving the closure here.
const FOCUS = "@learn6502/app-gnome";

const sources = JSON.parse(readFileSync("gjsify-sources.json", "utf8"));

const available = new Set(
  sources.filter((entry) => entry && typeof entry === "object").map((entry) => entry.url),
);

const dir = mkdtempSync(join(tmpdir(), "flatpak-sources-"));
const fresh = join(dir, "sources.json");
const cut = spawnSync("gjsify", ["flatpak", "sources", "--focus", FOCUS, "--out", fresh], {
  encoding: "utf8",
});
if (cut.status !== 0) {
  console.error(cut.stderr || cut.error?.message || "gjsify flatpak sources failed");
  process.exit(1);
}
const needed = JSON.parse(readFileSync(fresh, "utf8"));
rmSync(dir, { recursive: true, force: true });

const missing = new Map();
for (const entry of needed) {
  if (!entry || typeof entry !== "object" || available.has(entry.url)) continue;
  if (!missing.has(entry.url)) missing.set(entry.url, entry.url.replace(/^https:\/\/registry\.npmjs\.org\//, "").replace(/\/-\/.*$/, ""));
}

if (missing.size) {
  console.error(`gjsify-sources.json is missing ${missing.size} tarball(s) the focused install needs:`);
  for (const [tarball, name] of missing) {
    console.error(`  ${name} — ${tarball}`);
  }
  console.error(`\nRe-cut it: \`gjsify flatpak sources --focus ${FOCUS}\`. Both files are generated, and only`);
  console.error("that command rewrites the sources — a `gjsify install` alone leaves them behind.");
  process.exitCode = 1;
} else {
  console.log(`gjsify-sources.json covers all ${needed.length} tarball(s) ${FOCUS} needs.`);
}
