/**
 * Turn a `[example]` submission issue into the two files an example is made of:
 * `packages/examples/<slug>/<slug>.asm` and `<slug>.meta.ts`.
 *
 * The issue body is written by the app's share dialog (see
 * `packages/app-gnome/src/widgets/share-dialog.ts`) — a ```json metadata block
 * plus an ```assembly code block. Contributors can also paste that body by hand
 * when the prefilled GitHub URL exceeds GitHub's length limit, so treat every
 * field as untrusted input and validate it here rather than in shell.
 *
 * Usage: node .github/scripts/example-from-issue.mjs <issue-body-file> [repo-root]
 *
 * On success the rendered paths are appended to $GITHUB_OUTPUT (slug, base_dir,
 * code_path, meta_path). On failure the reason is written to
 * $EXAMPLE_ERROR_FILE — the workflow posts it back to the issue — and the
 * process exits non-zero. Both that file and the issue body live outside the
 * work tree so a failed run leaves nothing to accidentally commit.
 */
import fs from "node:fs";
import path from "node:path";

const [, , bodyFile, repoRootArg] = process.argv;
const repoRoot = repoRootArg ?? process.cwd();

/** Fields the app fills in and `ExampleMetaJson` requires. */
const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
/** `license` is a string-literal type in `example-meta.ts`; anything else fails `gjsify tsc`. */
const ALLOWED_LICENSES = ["CC-BY-4.0"];
/** The display is 32x32 cells, one hex byte each — the app snapshots it as 2048 hex chars. */
const DISPLAY_MEMORY_RE = /^[0-9a-fA-F]{2048}$/;
const GITHUB_USERNAME_RE = /^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/;

class SubmissionError extends Error {}

function fail(message) {
  throw new SubmissionError(message);
}

/**
 * Read a fenced block by its info string. Written by hand by some contributors,
 * so tolerate `” ```asm ”` and trailing whitespace after the fence.
 */
function readFencedBlock(body, languages) {
  for (const language of languages) {
    const match = body.match(new RegExp("```" + language + "[ \\t]*\\r?\\n([\\s\\S]*?)```"));
    if (match) return match[1];
  }
  return null;
}

function requireString(metadata, field, { maxLength = 200 } = {}) {
  const value = metadata[field];
  if (typeof value !== "string" || value.trim() === "") {
    fail(`\`${field}\` is missing or empty in the metadata block.`);
  }
  if (value.length > maxLength) {
    fail(`\`${field}\` is longer than ${maxLength} characters.`);
  }
  return value.trim();
}

/** Emit a TypeScript string literal — the values come from an issue, so escape properly. */
function tsString(value) {
  return JSON.stringify(value);
}

function renderMeta(metadata) {
  const lines = [
    'import { _ } from "@learn6502/core";',
    'import type { ExampleMetaJson } from "../example-meta.ts";',
    "export default {",
    `  slug: ${tsString(metadata.slug)},`,
    `  // TRANSLATORS: Example title for ${metadata.title}`,
    `  title: _(${tsString(metadata.title)}),`,
    `  // TRANSLATORS: Example description for ${metadata.title}`,
    `  description: _(${tsString(metadata.description)}),`,
    `  author: ${tsString(metadata.author)},`,
    `  license: ${tsString(metadata.license)},`,
    `  displayMemory: ${tsString(metadata.displayMemory)},`,
  ];
  if (metadata.sourceUrl) lines.push(`  sourceUrl: ${tsString(metadata.sourceUrl)},`);
  if (metadata.githubUsername) lines.push(`  githubUsername: ${tsString(metadata.githubUsername)},`);
  lines.push("} as ExampleMetaJson;", "");
  return lines.join("\n");
}

function parseSubmission(body) {
  const metadataBlock = readFencedBlock(body, ["json"]);
  if (metadataBlock === null) {
    fail(
      "No ```json metadata block found. If the app told you the example was too large to insert automatically, " +
        "paste the content it copied to your clipboard over the placeholder text and try again."
    );
  }

  let metadata;
  try {
    metadata = JSON.parse(metadataBlock);
  } catch (error) {
    fail("The ```json metadata block is not valid JSON: " + error.message);
  }
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) {
    fail("The ```json metadata block must contain a JSON object.");
  }

  const codeBlock = readFencedBlock(body, ["assembly", "asm", "6502"]);
  if (codeBlock === null) {
    fail("No ```assembly code block found.");
  }
  // Keep the source verbatim apart from the fence's own line breaks: the
  // comment art and indentation are part of what makes an example readable.
  const code = codeBlock.replace(/^\r?\n/, "").replace(/\s+$/, "") + "\n";
  if (code.trim() === "") {
    fail("The ```assembly code block is empty.");
  }

  const slug = requireString(metadata, "slug", { maxLength: 64 });
  if (!SLUG_RE.test(slug)) {
    fail(`\`slug\` must be lowercase letters, digits and single dashes (got \`${slug}\`).`);
  }

  const license = requireString(metadata, "license", { maxLength: 32 });
  if (!ALLOWED_LICENSES.includes(license)) {
    fail(`\`license\` must be one of ${ALLOWED_LICENSES.join(", ")} (got \`${license}\`).`);
  }

  const displayMemory = requireString(metadata, "displayMemory", { maxLength: 4096 });
  if (!DISPLAY_MEMORY_RE.test(displayMemory)) {
    fail("`displayMemory` must be exactly 2048 hex characters (a 32x32 display snapshot).");
  }

  const sourceUrl = typeof metadata.sourceUrl === "string" ? metadata.sourceUrl.trim() : "";
  if (sourceUrl && !/^https:\/\/[^\s"']+$/.test(sourceUrl)) {
    fail("`sourceUrl` must be an https URL.");
  }

  const githubUsername = typeof metadata.githubUsername === "string" ? metadata.githubUsername.trim() : "";
  if (githubUsername && !GITHUB_USERNAME_RE.test(githubUsername)) {
    fail(`\`githubUsername\` is not a valid GitHub username (got \`${githubUsername}\`).`);
  }

  return {
    slug,
    title: requireString(metadata, "title"),
    description: requireString(metadata, "description", { maxLength: 500 }),
    author: requireString(metadata, "author", { maxLength: 100 }),
    license,
    displayMemory: displayMemory.toLowerCase(),
    sourceUrl,
    githubUsername,
    code,
  };
}

function main() {
  if (!bodyFile) fail("Internal error: no issue body file given.");
  const body = fs.readFileSync(bodyFile, "utf8");
  const submission = parseSubmission(body);

  const baseDir = path.join("packages", "examples", submission.slug);
  const absoluteBaseDir = path.join(repoRoot, baseDir);
  if (fs.existsSync(absoluteBaseDir)) {
    fail(
      `An example with the slug \`${submission.slug}\` already exists (\`${baseDir}\`). ` +
        "Pick a different slug, or open a pull request against the existing example."
    );
  }

  const codePath = path.join(baseDir, `${submission.slug}.asm`);
  const metaPath = path.join(baseDir, `${submission.slug}.meta.ts`);
  fs.mkdirSync(absoluteBaseDir, { recursive: true });
  fs.writeFileSync(path.join(repoRoot, codePath), submission.code, "utf8");
  fs.writeFileSync(path.join(repoRoot, metaPath), renderMeta(submission), "utf8");

  const outputs = {
    slug: submission.slug,
    base_dir: baseDir,
    code_path: codePath,
    meta_path: metaPath,
  };
  for (const [key, value] of Object.entries(outputs)) {
    console.log(`${key}=${value}`);
    if (process.env.GITHUB_OUTPUT) {
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
  }
}

try {
  main();
} catch (error) {
  const message = error instanceof SubmissionError ? error.message : `Unexpected error: ${error.stack}`;
  fs.writeFileSync(process.env.EXAMPLE_ERROR_FILE ?? path.join(repoRoot, "example-error.txt"), message, "utf8");
  console.error(message);
  process.exit(1);
}