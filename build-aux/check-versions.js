/**
 * One version, six kinds of place that must agree.
 *
 * `gjsify ship` stamps `package.json#version` into every artifact it writes —
 * the `.deb` control file, the RPM header, `CFBundleShortVersionString`, the
 * MSI `ProductVersion` — and it reads that field from the ROOT manifest,
 * because that is where the `gjsify.ship`/`gjsify.flatpak` metadata lives. The
 * nine workspace packages carry their own version, and the AppStream
 * `<releases>` list carries a third copy that Flathub and GNOME Software show
 * to users.
 *
 * Nothing keeps those in step on its own. Changesets is configured with
 * `fixed: [["@learn6502/*"]]`, which does not match the private root package,
 * and the AppStream list is written by hand at release time. So a release can
 * ship a `.deb` labelled 0.7.0 from a tree whose packages say 0.8.0, and every
 * artifact would look right in isolation.
 *
 * This is the check that makes them one fact. It is deliberately a comparison
 * and not a rewrite: which version is correct is a release decision, and a
 * script that silently repaired the disagreement would hide the moment someone
 * bumped one place and forgot the rest.
 */

import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));

const root = read("package.json");
const expected = root.version;
const problems = [];

if (!expected) {
  problems.push("package.json has no `version`; `gjsify ship` reads it to label every artifact");
}

for (const name of readdirSync("packages")) {
  const manifest = `packages/${name}/package.json`;
  let pkg;
  try {
    pkg = read(manifest);
  } catch {
    continue; // not a package directory
  }
  if (pkg.version !== expected) {
    problems.push(`${manifest} is ${pkg.version}, root package.json is ${expected}`);
  }
}

// The newest AppStream release. `gjsify flatpak init` renders this list into
// the MetaInfo XML, and `gjsify ship` carries that XML into every package, so a
// stale head entry means the store shows a release that was never cut.
const releases = root.gjsify?.flatpak?.releases ?? [];
const newest = releases[0];
if (!newest) {
  problems.push("gjsify.flatpak.releases is empty; AppStream would announce no release at all");
} else if (newest.version !== expected) {
  problems.push(
    `gjsify.flatpak.releases[0] is ${newest.version}, root package.json is ${expected} — ` +
      "add the release entry before tagging, or the artifacts announce the previous one",
  );
}

// Meson's `project(version:)`. It is NOT a fifth copy of the same string for
// tidiness: `packages/app-gnome/meson.build` passes `meson.project_version()`
// through as `PACKAGE_VERSION`, which is the version the About dialog shows. The
// Flatpak — the build Flathub ships — is the one built through Meson, so leaving
// this behind means the store's copy of the app tells users the previous
// version while every artifact `gjsify ship` writes tells them the new one.
// Missed exactly that way on the 0.8.0 branch: eleven places agreed, About said
// 0.7.0, and this script reported success.
const meson = readFileSync("meson.build", "utf8");
const mesonVersion = /^\s*version:\s*'([^']*)'/m.exec(meson)?.[1];
if (!mesonVersion) {
  problems.push("meson.build has no `project(version:)`; PACKAGE_VERSION would be empty");
} else if (mesonVersion !== expected) {
  problems.push(
    `meson.build is ${mesonVersion}, root package.json is ${expected} — ` +
      "this is the version the About dialog shows in the Flatpak build",
  );
}

// The MetaInfo source. `gjsify flatpak init` renders `gjsify.flatpak.releases`
// into it, but the file is committed and edited by hand between renders, so the
// two can disagree — and it is this file, not the manifest field, that Meson
// installs and AppStream validates.
const METAINFO = "packages/app-gnome/data/metainfo/eu.jumplink.Learn6502.metainfo.xml.in";
const metainfoVersion = /<release\s+version="([^"]*)"/.exec(readFileSync(METAINFO, "utf8"))?.[1];
if (!metainfoVersion) {
  problems.push(`${METAINFO} lists no <release>; AppStream would announce no release at all`);
} else if (metainfoVersion !== expected) {
  problems.push(`${METAINFO} announces ${metainfoVersion}, root package.json is ${expected}`);
}

if (problems.length) {
  console.error(`Version mismatch across ${problems.length} place(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("\nEvery place above must carry the same version before a release is tagged.");
  process.exitCode = 1;
} else {
  console.log(
    `All versions agree on ${expected} ` +
      `(root, ${readdirSync("packages").length} packages, meson.build, AppStream manifest + MetaInfo).`,
  );
}
