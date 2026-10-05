#!/usr/bin/env node
/**
 * Carry the version `changeset version` just wrote onto the ROOT manifest.
 *
 * Changesets bumps the packages in `fixed: [["@learn6502/*"]]` — all nine of
 * them, in step. It does NOT touch the root, because the root is not a
 * workspace member: it is the private manifest that holds `gjsify.ship`, and
 * `gjsify ship` stamps ITS version into every artifact name and into the
 * package metadata a user sees after installing.
 *
 * So without this step the release is internally inconsistent in the one place
 * that reaches users: nine packages say 0.8.0 and the `.deb` says 0.7.0.
 * `build-aux/check-versions.js` catches that — but catching it means the
 * release stops half-done and someone edits a number by hand, which is the
 * step this removes.
 *
 * The AppStream `<release>` entry is deliberately NOT written here. It carries
 * prose a human writes for end users — the 0.7.0 entry thanks a contributor in
 * Hebrew and tells translators to keep the greeting — and a generated line
 * would make the release notes worse, not faster. `check-versions.js` still
 * requires it to exist and to match, so forgetting it fails loudly.
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { glob } from "node:fs/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const read = async (p) => JSON.parse(await readFile(p, "utf8"));

const members = [];
for await (const entry of glob("packages/*/package.json", { cwd: root })) {
  members.push(entry);
}
members.sort();

const versions = new Map();
for (const rel of members) {
  const pkg = await read(join(root, rel));
  if (!pkg.name?.startsWith("@learn6502/")) continue;
  versions.set(pkg.version, [...(versions.get(pkg.version) ?? []), pkg.name]);
}

if (versions.size === 0) {
  console.error("sync-root-version: found no @learn6502/* package to read a version from");
  process.exit(1);
}

// `fixed` means one version across the group. More than one here is not a
// rounding error — it means the fixed group stopped applying, and guessing
// which of them the root should follow would paper over that.
if (versions.size > 1) {
  console.error("sync-root-version: the @learn6502/* group is not on one version:");
  for (const [v, names] of versions) console.error(`  ${v}  ${names.join(", ")}`);
  console.error("\n`fixed: [[\"@learn6502/*\"]]` in .changeset/config.json should prevent this.");
  process.exit(1);
}

const [version] = [...versions.keys()];
const rootPath = join(root, "package.json");
const text = await readFile(rootPath, "utf8");
const current = JSON.parse(text).version;

if (current === version) {
  console.log(`sync-root-version: root already at ${version} — nothing to do`);
  process.exit(0);
}

// A targeted replacement rather than a JSON round-trip: the root manifest is
// hand-maintained and re-serialising it would reformat everything around the
// one field that changed.
const pattern = /^(\s*)"version"\s*:\s*"[^"]*"/m;
if (!pattern.test(text)) {
  console.error(`sync-root-version: no "version" field in ${rootPath}`);
  process.exit(1);
}
await writeFile(rootPath, text.replace(pattern, (_m, indent) => `${indent}"version": "${version}"`), "utf8");
console.log(`sync-root-version: root ${current} -> ${version} (from ${versions.get(version).length} @learn6502/* packages)`);
