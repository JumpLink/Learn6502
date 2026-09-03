/**
 * Structural validation for the translation catalogs.
 *
 * `msgfmt` only asks whether a `msgstr` is non-empty, so a catalog can report
 * "100% translated" while shipping markup that Pango refuses to parse and code
 * identifiers the tutorial tells the reader to look for in the editor. Both
 * classes reached `main` unnoticed — see the rules below for the concrete
 * damage each one guards against.
 *
 * Run via `gjsify workspace @learn6502/translations check`.
 */

import { readFileSync, readdirSync } from "node:fs";

// The package directory, which is where `gjsify workspace` runs a script from.
// Deliberately not derived from `import.meta.url`: the `--app gjs` target runs
// a bundle written to `dist/`, so a script-relative path finds no catalogs at
// all there and the run reports success having read nothing.
const PO_DIR = ".";

/**
 * Inline `<tt>` spans whose content is prose rather than code, and may
 * therefore be translated. Every entry needs a reason: the default is that a
 * `<tt>` span is a literal the reader retypes or searches for, so exempting one
 * is a claim that it is not.
 */
const PROSE_TT = new Set([
  // Metasyntactic placeholder in the addressing-mode list: "<b>Relative</b>
  // (<tt>label</tt>): Branch uses signed 8-bit offset ...". It stands for "any
  // label", not for a label named `label`.
  "label",
]);

/** Reads every `<lang>.po` next to this script. */
function readCatalogs() {
  return readdirSync(PO_DIR)
    .filter((name) => name.endsWith(".po"))
    .sort()
    .map((name) => ({ lang: name.slice(0, -3), entries: parsePo(`${PO_DIR}/${name}`) }));
}

/**
 * Minimal PO reader: enough for `msgid`/`msgstr` pairs with continuation lines.
 * The catalogs are generated with `noWrap`, but Weblate still folds long
 * strings, so continuations have to be joined.
 */
function parsePo(path) {
  const entries = [];
  let msgid = null;
  let msgstr = null;
  let field = null;

  const flush = () => {
    if (msgid) entries.push({ msgid, msgstr: msgstr ?? "" });
    msgid = null;
    msgstr = null;
    field = null;
  };

  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    if (line.startsWith("msgid ")) {
      if (field === "msgstr") flush();
      msgid = unquote(line.slice(6));
      field = "msgid";
    } else if (line.startsWith("msgstr ")) {
      msgstr = unquote(line.slice(7));
      field = "msgstr";
    } else if (line.startsWith('"') && field) {
      if (field === "msgid") msgid += unquote(line);
      else msgstr += unquote(line);
    } else if (line === "" && field === "msgstr") {
      flush();
    } else if (line.startsWith("#")) {
      // comment or flag line — carries no data this check needs
    }
  }
  flush();
  return entries.filter((entry) => entry.msgid !== "");
}

function unquote(value) {
  const trimmed = value.trim();
  const inner = trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
  return inner.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
}

const TAG = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?>/g;
const TT = /<tt>([\s\S]*?)<\/tt>/g;
const PLACEHOLDER = /%[sd]|%\d+\$[sd]|\{\w+\}|%\{\w+\}/g;

/**
 * Rule 1 — the markup must parse.
 *
 * Tutorial paragraphs are rendered through `GtkLabel use-markup` (see
 * `packages/learn/tsx/components/gtk/`). Pango treats a malformed fragment as
 * an error and leaves the label blank, so a broken `<a href=...>` silently
 * costs the reader a whole paragraph.
 */
function markupErrors(text) {
  const stack = [];
  const errors = [];

  // Reject the shapes a text parser would otherwise accept: a `<` that opens
  // no valid tag, and an unquoted or unterminated attribute list.
  for (const match of text.matchAll(/<[^>]*(?:>|$)/g)) {
    const token = match[0];
    if (!token.endsWith(">")) errors.push(`unterminated tag: ${clip(token)}`);
    else if (!/^<\/?[a-zA-Z][a-zA-Z0-9]*(?:\s+[a-zA-Z-]+="[^"]*")*\s*\/?>$/.test(token))
      errors.push(`malformed tag: ${clip(token)}`);
  }

  for (const match of text.matchAll(TAG)) {
    const name = match[1];
    if (match[0].startsWith("</")) {
      if (stack.pop() !== name) errors.push(`unbalanced </${name}>`);
    } else if (!match[0].endsWith("/>")) {
      stack.push(name);
    }
  }
  for (const name of stack) errors.push(`unclosed <${name}>`);
  return errors;
}

/**
 * Rule 2 — every tag the source opens must survive translation.
 *
 * Compared by tag name as a multiset, not as a sequence of full tags: word
 * order legitimately moves an emphasised span, and the README lets a translator
 * point an `<a>` at an equivalent page in the target language. What is not
 * allowed is dropping the span, which costs the emphasis or the whole link.
 *
 * In-document anchors are the exception — `<a href="#jumping">` navigates
 * inside the tutorial, so a rewritten fragment is a dead link, not a
 * localisation.
 */
function tagCounts(text) {
  return count(
    [...text.matchAll(TAG)].map((match) => {
      const fragment = /<a\s[^>]*href="(#[^"]*)"/.exec(match[0]);
      return fragment ? `<a href="${fragment[1]}">` : match[0].replace(/^<(\/?)([a-zA-Z0-9]+).*$/, "<$1$2>");
    })
  );
}

/**
 * Rule 3 — `<tt>` content is code and must survive byte-for-byte.
 *
 * These spans name subroutines, labels, opcodes and addresses that the reader
 * looks up in the editor. Translating `<tt>illegalMove</tt>` or
 * `<tt>0001 AND 0001</tt>` produces a tutorial that describes code the reader
 * cannot find, and `<tt>JSR end</tt>` no longer assembles.
 */
function codeLiterals(text) {
  return count([...text.matchAll(TT)].map((match) => match[1]).filter((literal) => !PROSE_TT.has(literal)));
}

/** Rule 4 — format placeholders must survive, or the string breaks at runtime. */
function placeholders(text) {
  return count([...text.matchAll(PLACEHOLDER)].map((match) => match[0]));
}

function count(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}

/** Members of `expected` that `actual` does not cover, with multiplicity. */
function missing(expected, actual) {
  const lost = [];
  for (const [value, times] of expected) {
    const short = times - (actual.get(value) ?? 0);
    for (let i = 0; i < short; i++) lost.push(value);
  }
  return lost;
}

function clip(text) {
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

function check() {
  const failures = [];
  const catalogs = readCatalogs();

  // A run that reads nothing passes every rule, which is the one failure this
  // check must never report as success. LINGUAS is the count the build uses.
  const expected = readFileSync(`${PO_DIR}/LINGUAS`, "utf8").split("\n").filter(Boolean).length;
  if (catalogs.length !== expected) {
    console.error(`Read ${catalogs.length} catalogs from ${PO_DIR}, but LINGUAS names ${expected}.`);
    return 1;
  }

  for (const { lang, entries } of catalogs) {
    for (const { msgid, msgstr } of entries) {
      if (msgstr === "") continue;
      const problems = [];

      for (const error of markupErrors(msgstr)) problems.push(`invalid markup — ${error}`);

      const lostTags = missing(tagCounts(msgid), tagCounts(msgstr));
      if (lostTags.length) problems.push(`dropped tags — ${lostTags.map(clip).join(", ")}`);

      const lostCode = missing(codeLiterals(msgid), codeLiterals(msgstr));
      if (lostCode.length)
        problems.push(`altered code literals — ${lostCode.map((l) => `<tt>${clip(l)}</tt>`).join(", ")}`);

      const lostPlaceholders = missing(placeholders(msgid), placeholders(msgstr));
      if (lostPlaceholders.length) problems.push(`dropped placeholders — ${lostPlaceholders.join(", ")}`);

      if (problems.length) failures.push({ lang, msgid, problems });
    }
  }

  for (const { lang, msgid, problems } of failures) {
    console.error(`${lang}.po: ${clip(msgid.replace(/\n/g, " "))}`);
    for (const problem of problems) console.error(`  ${problem}`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} translation(s) failed structural validation.`);
    return 1;
  }

  console.log("All translations passed structural validation.");
  return 0;
}

const status = check();
// `gjsify run` keeps the GJS main loop alive, so signal the result explicitly.
if (status !== 0) throw new Error("translation check failed");
