/**
 * Structural validation for the translation catalogs.
 *
 * `msgfmt` only asks whether a `msgstr` is non-empty, so a catalog can report
 * "100% translated" while shipping markup that Pango refuses to parse and code
 * identifiers the tutorial tells the reader to look for in the editor. Both
 * classes reached `main` unnoticed — see the rules below for the concrete
 * damage each one guards against.
 *
 * Every markup shape this file accepts or rejects was measured against
 * `Gtk.Label` with `use-markup` on GTK 4 / Pango 1.57, not inferred from the
 * documentation: a label whose markup fails to parse renders as an empty
 * string, which is the damage the check exists to prevent.
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

/**
 * Tags a label may contain.
 *
 * Pango also accepts `<span>` and the `<markup>` root, and both are left out on
 * purpose: `<span>` carries typed attribute values (`<span foreground="x">`
 * fails to parse because `x` is not a colour), and validating those is a whole
 * second parser. Nothing in the source strings uses either — the tutorial's
 * vocabulary is `a`, `b`, `i`, `sub` and `tt` — so a translation that grows one
 * is a defect worth reporting even when Pango would have accepted it.
 */
const TAGS = new Set(["a", "b", "big", "i", "s", "small", "sub", "sup", "tt", "u"]);

/**
 * Attributes each tag accepts, and the ones it cannot do without.
 *
 * Pango rejects the whole label for an attribute it does not know — `<tt
 * class="c">` and `<b onclick="…">` both parse to nothing — and `<a>` without
 * `href` is rejected outright ("Attribute 'href' was missing on the <a> tag").
 * Every tag outside this table takes no attributes at all.
 */
const TAG_ATTRIBUTES = { a: { allowed: new Set(["href", "title"]), required: ["href"] } };

/**
 * The entities GMarkup resolves, plus numeric character references.
 *
 * Anything else — a bare `&`, an HTML-only name like `&nbsp;`, a stray `&` in a
 * retargeted link's query string — is a parse error, so the paragraph renders
 * blank. This is the failure a translator is most likely to introduce by hand.
 */
const ENTITY = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;

/** One markup token: `<…>`, or a trailing `<` with no `>` after it. */
const TOKEN = /<[^>]*(?:>|$)/g;
const OPEN_TAG = /^<([a-zA-Z][a-zA-Z0-9]*)((?:\s+[a-zA-Z_:][\w.:-]*\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>$/;
const CLOSE_TAG = /^<\/([a-zA-Z][a-zA-Z0-9]*)\s*>$/;
const ATTRIBUTE = /\s+([a-zA-Z_:][\w.:-]*)\s*=\s*(?:"[^"]*"|'[^']*')/g;

const TT = /<tt>([\s\S]*?)<\/tt>/g;
const PLACEHOLDER = /%[sd]|%\d+\$[sd]|\{\w+\}|%\{\w+\}/g;

/** PO string escapes. Anything else after a backslash stands for itself. */
const ESCAPES = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\" };

/** Reads every `<lang>.po` in the catalog directory. */
function readCatalogs() {
  return readdirSync(PO_DIR)
    .filter((name) => name.endsWith(".po"))
    .sort()
    .map((name) => ({ lang: name.slice(0, -3), entries: parsePo(`${PO_DIR}/${name}`) }));
}

/**
 * Minimal PO reader: `msgid`/`msgstr` pairs including `msgctxt`, plural forms
 * and continuation lines. The catalogs are generated with `noWrap`, but Weblate
 * still folds long strings, so continuations have to be joined.
 *
 * Plural forms are read even though no catalog has one yet. A parser that
 * silently skips a shape it does not know turns every rule below into a rule
 * that passed because it never ran — the same way the first version of this
 * check passed by reading no catalogs at all.
 */
function parsePo(path) {
  const entries = [];
  let msgid = null;
  let plural = null;
  let msgstrs = [];
  let field = null;

  const flush = () => {
    // The header entry has an empty `msgid` and carries no translatable markup.
    if (msgid) entries.push({ msgid, plural, msgstrs });
    msgid = null;
    plural = null;
    msgstrs = [];
    field = null;
  };

  for (const raw of readFileSync(path, "utf8").split("\n")) {
    const line = raw.trim();
    let match;
    if (line.startsWith("#")) {
      // Comments, flags and `#~` obsolete entries carry nothing this check
      // needs; an obsolete entry is not compiled into the catalog.
    } else if (line.startsWith("msgctxt ")) {
      flush();
      field = "msgctxt";
    } else if (line.startsWith("msgid ")) {
      // A `msgctxt` line has already opened this entry.
      if (field !== "msgctxt") flush();
      msgid = unquote(line.slice(6));
      field = "msgid";
    } else if (line.startsWith("msgid_plural ")) {
      plural = unquote(line.slice(13));
      field = "msgid_plural";
    } else if ((match = /^msgstr(?:\[(\d+)\])?\s/.exec(line))) {
      const index = match[1] ? Number(match[1]) : 0;
      msgstrs[index] = unquote(line.slice(match[0].length));
      field = `msgstr${index}`;
    } else if (line.startsWith('"') && field) {
      const text = unquote(line);
      if (field === "msgid") msgid += text;
      else if (field === "msgid_plural") plural += text;
      else if (field.startsWith("msgstr")) msgstrs[Number(field.slice(6))] += text;
      // `msgctxt` continuations disambiguate the entry, they are not rendered.
    } else if (line === "" && field?.startsWith("msgstr")) {
      flush();
    }
  }
  flush();
  return entries;
}

function unquote(value) {
  const trimmed = value.trim();
  const inner = trimmed.startsWith('"') && trimmed.endsWith('"') ? trimmed.slice(1, -1) : trimmed;
  // One pass, because chained replacements would rewrite the `n` of an escaped
  // backslash: `\\n` is a backslash followed by the letter n, not a newline.
  return inner.replace(/\\(.)/g, (_, char) => ESCAPES[char] ?? char);
}

/**
 * Splits `text` into markup tokens, reporting every shape Pango rejects and
 * returning the tags it found, normalised for comparison.
 *
 * One scan feeds both rule 1 and rule 2 so the two cannot disagree about where
 * a tag begins: a token that the balance check accepts but the tag comparison
 * does not see is a gap wide enough to walk a dropped `<b>` through.
 */
function scanMarkup(text) {
  const errors = [];
  const tags = [];
  const stack = [];

  for (let index = text.indexOf("&"); index !== -1; index = text.indexOf("&", index + 1)) {
    if (!ENTITY.test(text.slice(index)))
      errors.push(`unescaped & or unknown entity: ${clip(text.slice(index, index + 16))}`);
  }

  for (const match of text.matchAll(TOKEN)) {
    const token = match[0];
    if (!token.endsWith(">")) {
      errors.push(`unterminated tag: ${clip(token)}`);
      continue;
    }

    const close = CLOSE_TAG.exec(token);
    if (close) {
      tags.push(`</${close[1]}>`);
      if (stack.pop() !== close[1]) errors.push(`unbalanced </${close[1]}>`);
      continue;
    }

    const open = OPEN_TAG.exec(token);
    if (!open) {
      errors.push(`malformed tag: ${clip(token)}`);
      continue;
    }

    const [, name, attributeList, selfClosing] = open;
    const attributes = [...attributeList.matchAll(ATTRIBUTE)].map((attribute) => attribute[1]);
    const rules = TAG_ATTRIBUTES[name];

    if (!TAGS.has(name)) errors.push(`unsupported tag: <${name}>`);
    for (const attribute of attributes) {
      if (!rules?.allowed.has(attribute)) errors.push(`<${name}> does not support the ${attribute} attribute`);
    }
    for (const attribute of rules?.required ?? []) {
      if (!attributes.includes(attribute)) errors.push(`<${name}> is missing the ${attribute} attribute`);
    }

    // An `<a>` whose href is empty still parses, so Pango cannot report it; it
    // renders as text the reader can click to nowhere.
    const href = /href\s*=\s*["']([^"']*)["']/.exec(attributeList);
    if (href && !href[1].trim()) errors.push(`<${name}> has an empty href`);

    // In-document anchors navigate inside the tutorial, so a rewritten fragment
    // is a dead link rather than a localisation and has to survive verbatim.
    // Every other href may be retargeted, as the README allows.
    tags.push(href?.[1].startsWith("#") ? `<a href="${href[1]}">` : `<${name}>`);
    if (!selfClosing) stack.push(name);
  }

  for (const name of stack) errors.push(`unclosed <${name}>`);
  return { errors, tags };
}

/**
 * Rule 1 — the markup must parse.
 *
 * Tutorial paragraphs are rendered through `GtkLabel use-markup` (see
 * `packages/learn/tsx/components/gtk/`). Pango treats a malformed fragment as
 * an error and leaves the label blank, so a broken `<a href=...>`, an unescaped
 * `&` or a tag Pango does not know silently costs the reader a whole paragraph.
 */
function markupErrors(text) {
  return scanMarkup(text).errors;
}

/**
 * Rule 2 — every tag the source opens must survive translation.
 *
 * Compared by tag name as a multiset, not as a sequence of full tags: word
 * order legitimately moves an emphasised span, and the README lets a translator
 * point an `<a>` at an equivalent page in the target language. What is not
 * allowed is dropping the span, which costs the emphasis or the whole link.
 */
function tagCounts(text) {
  return count(scanMarkup(text).tags);
}

/**
 * Rule 3 — `<tt>` content is code and must survive byte-for-byte.
 *
 * These spans name subroutines, labels, opcodes and addresses that the reader
 * looks up in the editor. Translating `<tt>illegalMove</tt>` or
 * `<tt>0001 AND 0001</tt>` produces a tutorial that describes code the reader
 * cannot find, and `<tt>JSR end</tt>` no longer assembles. Matching a bare
 * `<tt>` is exact rather than lax: Pango accepts no attribute on the tag, so
 * rule 1 has already rejected any `<tt …>` before this runs.
 */
function codeLiterals(text) {
  return count([...text.matchAll(TT)].map((match) => match[1]).filter((literal) => !PROSE_TT.has(literal)));
}

/**
 * Rule 4 — format placeholders must survive, and no new one may appear.
 *
 * A dropped placeholder loses the value it stood for; an added one consumes an
 * argument that was never passed. Both break the string at runtime, so the
 * comparison runs in both directions.
 */
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
    for (let index = 0; index < short; index++) lost.push(value);
  }
  return lost;
}

function clip(text) {
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

/** Applies every rule to one source/translation pair. */
function entryProblems(source, translation) {
  const problems = [];

  for (const error of markupErrors(translation)) problems.push(`invalid markup — ${error}`);

  const lostTags = missing(tagCounts(source), tagCounts(translation));
  if (lostTags.length) problems.push(`dropped tags — ${lostTags.map(clip).join(", ")}`);

  const lostCode = missing(codeLiterals(source), codeLiterals(translation));
  if (lostCode.length)
    problems.push(`altered code literals — ${lostCode.map((literal) => `<tt>${clip(literal)}</tt>`).join(", ")}`);

  const sourcePlaceholders = placeholders(source);
  const translated = placeholders(translation);
  const lost = missing(sourcePlaceholders, translated);
  if (lost.length) problems.push(`dropped placeholders — ${lost.join(", ")}`);
  const added = missing(translated, sourcePlaceholders);
  if (added.length) problems.push(`added placeholders — ${added.join(", ")}`);

  return problems;
}

/**
 * Pairs every rule must classify correctly, checked before any catalog is read.
 *
 * A structural check that has quietly stopped biting is worse than no check at
 * all: it reports success over content nobody has looked at, which is exactly
 * how the damage this file guards against reached `main` in the first place.
 * The rejected shapes are the ones `Gtk.Label` renders as an empty string; the
 * accepted ones are legitimate translations that must not be flagged.
 */
const SELF_TEST = [
  ["Hello <b>world</b>", "Hallo <b>Welt</b>", "accept"],
  ["<b>A</b> then <i>B</i>", "<i>B</i>, dann <b>A</b>", "accept"],
  [
    'See <a href="https://en.wikipedia.org/wiki/X">this</a>.',
    'Siehe <a href="https://de.wikipedia.org/wiki/X">dies</a>.',
    "accept",
  ],
  ['See <a href="https://x/" title="t">this</a>.', "Siehe <a href='https://x/' title='t'>dies</a>.", "accept"],
  // A right-to-left translation, with the RLM (U+200F) an RTL catalog may carry.
  ["Use <tt>LDA</tt> here", "\u200fהשתמש ב־<tt>LDA</tt> כאן", "accept"],
  ["A &amp; B", "A &amp; B", "accept"],
  ["<tt>label</tt> marks a spot", "<tt>Marke</tt> markiert eine Stelle", "accept"],
  ["Line %s of %d", "Zeile %s von %d", "accept"],
  ["A and B", "A & B", "reject"],
  ["A and B", "A&nbsp;B", "reject"],
  ["<b><i>x</i></b>", "<b><i>x</b></i>", "reject"],
  ['See <a href="https://x/">this</a>', "Siehe <a>dies</a>", "reject"],
  ['See <a href="https://x/">this</a>', 'Siehe <a href="">dies</a>', "reject"],
  ["<b>x</b>", '<b onclick="x">x</b>', "reject"],
  ["<b>x</b>", "<b>x</b> <blink>y</blink>", "reject"],
  ["<tt>LDA</tt>", '<tt class="c">LDA</tt>', "reject"],
  ["<tt>illegalMove</tt>", "<tt>ungueltigerZug</tt>", "reject"],
  ['<a href="#jumping">jumping</a>', '<a href="#springen">Springen</a>', "reject"],
  ["<b>A</b> and <i>B</i>", "<b>A</b> und <b>B</b>", "reject"],
  ["Line %s", "Zeile %s %s", "reject"],
  ["Line %s", "Zeile", "reject"],
];

/** Self-test results that came out the wrong way round. */
function selfTestFailures() {
  const wrong = [];
  for (const [source, translation, expected] of SELF_TEST) {
    const problems = entryProblems(source, translation);
    const verdict = problems.length ? "reject" : "accept";
    if (verdict !== expected)
      wrong.push(`expected to ${expected}: ${clip(translation)} (${problems.join("; ") || "no problem reported"})`);
  }
  return wrong;
}

/** The languages the build compiles, which is the set that must be checked. */
function expectedLanguages() {
  return new Set(
    readFileSync(`${PO_DIR}/LINGUAS`, "utf8")
      .split("\n")
      .map((line) => line.replace(/#.*$/, "").trim())
      .filter(Boolean)
  );
}

function check() {
  const selfTest = selfTestFailures();
  if (selfTest.length) {
    console.error("The structural rules no longer classify their own test cases:");
    for (const failure of selfTest) console.error(`  ${failure}`);
    return 1;
  }

  const catalogs = readCatalogs();

  // A run that reads nothing passes every rule, which is the one failure this
  // check must never report as success. Names are compared, not just counted:
  // a stray `.po` next to a missing one keeps the count right while leaving a
  // shipped language unchecked.
  const expected = expectedLanguages();
  const read = new Set(catalogs.map((catalog) => catalog.lang));
  const unread = [...expected].filter((lang) => !read.has(lang));
  const unlisted = [...read].filter((lang) => !expected.has(lang));
  if (unread.length || unlisted.length) {
    if (unread.length)
      console.error(`LINGUAS names ${unread.length} language(s) with no catalog in ${PO_DIR}: ${unread.join(", ")}`);
    if (unlisted.length)
      console.error(`${PO_DIR} holds ${unlisted.length} catalog(s) LINGUAS does not name: ${unlisted.join(", ")}`);
    return 1;
  }

  const failures = [];
  // The English source is checked once rather than once per language: a broken
  // fragment in `tutorial.mdx` reaches every catalog through the `.pot`.
  const sources = new Set();

  for (const { lang, entries } of catalogs) {
    for (const { msgid, plural, msgstrs } of entries) {
      sources.add(msgid);
      if (plural) sources.add(plural);

      for (const [index, msgstr] of msgstrs.entries()) {
        if (!msgstr) continue;
        // Form 0 renders the singular, every later form the plural.
        const source = index === 0 ? msgid : (plural ?? msgid);
        const problems = entryProblems(source, msgstr);
        if (problems.length) failures.push({ where: `${lang}.po`, msgid, problems });
      }
    }
  }

  for (const source of sources) {
    const problems = markupErrors(source);
    if (problems.length)
      failures.push({
        where: "English source",
        msgid: source,
        problems: problems.map((error) => `invalid markup — ${error}`),
      });
  }

  for (const { where, msgid, problems } of failures) {
    console.error(`${where}: ${clip(msgid.replace(/\n/g, " "))}`);
    for (const problem of problems) console.error(`  ${problem}`);
  }

  if (failures.length) {
    console.error(`\n${failures.length} string(s) failed structural validation.`);
    return 1;
  }

  console.log(
    `All translations passed structural validation (${catalogs.length} catalogs, ${SELF_TEST.length} self-test cases).`
  );
  return 0;
}

const status = check();
// `gjsify run` keeps the GJS main loop alive, so signal the result explicitly.
if (status !== 0) throw new Error("translation check failed");
