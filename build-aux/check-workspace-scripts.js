/**
 * `gjsify workspace <name> <script>` fails hard when `<script>` does not
 * exist on `<name>` — unlike `gjsify foreach`, which skips a workspace that
 * lacks the requested script. That makes it the wrong command to leave
 * unchecked: nothing catches a target script being renamed or dropped until
 * someone runs the caller.
 *
 * Found exactly that way, twice, in the same audit: the root `build:android`
 * script called `@learn6502/app-android`'s `build`, which had never existed
 * (the real build is `ns build android`, wired up only as `start`/`start:*`).
 * And `start:web` called `@learn6502/app-web`'s `start`, which the Jekyll ->
 * Vite rewrite renamed to `dev:app` without updating the root script that
 * still pointed at the old name. Both had sat broken since they were written;
 * nothing ran them until this check did.
 *
 * This walks every `gjsify workspace <name> <script>` call in every
 * `package.json` (root + `packages/*`) and every `.github/workflows/*.yml`,
 * and confirms `<name>` exists and carries `<script>`. It is a comparison,
 * not a rewrite — which side is wrong (the caller or the target) is a design
 * decision, not something this script should guess.
 */

import { readFileSync, readdirSync } from "node:fs";

const read = (path) => JSON.parse(readFileSync(path, "utf8"));

// name -> { scripts, file }
const workspaces = new Map();
// file -> parsed package.json, for the scripts pass below.
const manifests = new Map();
const packageJsonFiles = [
  "package.json",
  ...readdirSync("packages").map((name) => `packages/${name}/package.json`),
];
for (const file of packageJsonFiles) {
  let pkg;
  try {
    pkg = read(file);
  } catch {
    continue; // not a package directory
  }
  manifests.set(file, pkg);
  if (pkg.name) workspaces.set(pkg.name, { scripts: pkg.scripts ?? {}, file });
}

// Matches `gjsify workspace <name> <script>`, stopping the script name at the
// first flag/operator (`--with-dependencies`, `&&`, end of line, …) so a call
// like `gjsify workspace @learn6502/app-gnome build --with-dependencies`
// checks `build`, not the flag.
const CALL = /gjsify workspace (@?[\w./-]+)\s+([\w:.-]+)/g;

const problems = [];

function scan(source, text) {
  CALL.lastIndex = 0;
  let match;
  while ((match = CALL.exec(text))) {
    const [, name, script] = match;
    const target = workspaces.get(name);
    if (!target) {
      problems.push(`${source} calls workspace "${name}", which no package.json declares as its name`);
      continue;
    }
    if (!(script in target.scripts)) {
      problems.push(`${source} calls \`${name} ${script}\`, but ${target.file} has no "${script}" script`);
    }
  }
}

for (const [file, pkg] of manifests) {
  for (const [key, value] of Object.entries(pkg.scripts ?? {})) {
    scan(`${file}#${key}`, value);
  }
}

const WORKFLOWS_DIR = ".github/workflows";
for (const file of readdirSync(WORKFLOWS_DIR)) {
  if (!file.endsWith(".yml") && !file.endsWith(".yaml")) continue;
  const path = `${WORKFLOWS_DIR}/${file}`;
  scan(path, readFileSync(path, "utf8"));
}

if (problems.length) {
  console.error(`${problems.length} dead \`gjsify workspace\` reference(s):`);
  for (const problem of problems) console.error(`  ${problem}`);
  console.error("\nEither the caller names the wrong script, or the target should carry it — fix whichever is right.");
  process.exitCode = 1;
} else {
  console.log(`All \`gjsify workspace <name> <script>\` calls resolve (${workspaces.size} workspace(s) checked).`);
}
