/**
 * Structural validation for the generated tutorial artifacts.
 *
 * One MDX source used to be rendered into three unrelated targets — `.ui` for
 * app-gnome, `.ns.xml` for app-android, `.html` for app-web — and nothing
 * downstream read all three, so a renderer change that broke only one of them
 * reached `main` looking green. There is one target now: `dist/*.blp`, which
 * all three platforms compile through `@gjsify/vite-plugin-blueprint`. That
 * removes the class of bug the cross-target rules existed for, and removes the
 * independent witness they were made of — so what is checked here is the
 * blueprint against the GtkBuilder XML it compiles to, and that XML against
 * what its consumers can actually resolve.
 *
 * The rules below are structural on purpose. A byte snapshot of a 150 KB
 * generated file is a diff nobody reads and everybody regenerates, so it stops
 * being evidence the first time someone reformats the emitter. What is asserted
 * here is what the consumers actually require, and every rule names the damage
 * it prevents.
 *
 * Every markup verdict was measured rather than inferred: `Pango.parse_markup`
 * on GTK 4 / Pango 1.57 rejects `&ndash;` and `&times;` as unknown entities,
 * and a `Gtk.Label` whose markup fails to parse renders as an empty string — a
 * whole tutorial paragraph gone, with no error anywhere.
 *
 * Run via `gjsify workspace @learn6502/learn check`, which clears and rebuilds
 * `dist/` first: a check that reads whatever artifact happened to be lying
 * around is the same defect it exists to catch, and a leftover from the
 * previous run makes an emitter that stopped writing look like one that wrote
 * the same thing again.
 */

import { existsSync, readFileSync } from "node:fs";
import { emitGtkBuilderXml, parseBlueprint } from "@gjsify/blueprint";
import { uiToBlueprint } from "./tsx/ui-to-blueprint.ts";

// The package directory, which is where `gjsify workspace` runs a script from.
// Deliberately not derived from `import.meta.url`: the `--app gjs` target runs
// a bundle written to `dist/`, so a script-relative path would resolve one
// directory too deep and the run would report success having read nothing.
const DIST = "dist";

/** The MDX documents rendered by `tsx/index.tsx`, each into one `.blp`. */
const DOCUMENTS = ["tutorial", "quick-help"];

/**
 * The element vocabulary the compiled GtkBuilder XML may contain.
 *
 * An allow-list, not a description: a new element in a generated file is a
 * claim that the consumer can render it, and that claim only becomes true once
 * someone has taught the consumer about it. All three platforms load the
 * compiled XML through a builder that refuses the whole document on an element
 * or GType it cannot resolve, so growing this list is a deliberate act, paired
 * with the widget that handles the new element.
 */
const VOCABULARY = {
  root: "interface",
  elements: new Set(["interface", "requires", "template", "child", "object", "property", "style", "class"]),
  // `SourceView` is the apps' own widget, not a GTK class — it resolves because
  // each platform registers its type before the builder runs.
  objectClasses: new Set(["GtkBox", "GtkLabel", "SourceView"]),
};

/**
 * Tags a `Gtk.Label` may contain, and the attributes each one accepts.
 *
 * This is Pango's vocabulary rather than HTML's, and deliberately narrower than
 * what Pango would tolerate: it is the same list `packages/translations/check.js`
 * enforces on the other side of the pipeline, so a fragment that survives
 * extraction into the catalogs is one translators are allowed to keep.
 */
const LABEL_TAGS = new Set(["a", "b", "big", "i", "s", "small", "sub", "sup", "tt", "u"]);
const LABEL_TAG_ATTRIBUTES = { a: { allowed: new Set(["href", "title"]), required: ["href"] } };

/**
 * The entity references both XML and GMarkup resolve, plus numeric ones.
 *
 * Neither parser knows the HTML entity set. `&ndash;`, `&times;` and `&nbsp;`
 * are the ones a Markdown author reaches for out of habit, and each of them
 * costs the reader the entire paragraph it appears in.
 */
const ENTITY = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;

/** Attribute inside a start tag, with the value in either quote style. */
const ATTRIBUTE = /([a-zA-Z_:][\w.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

const TRANSLATABLE_LABEL = /<property name="label" translatable="yes"([^>]*)>([\s\S]*?)<\/property>/g;
// The whole `SourceView` element, not `<property name="code">` pinned to the
// front of it: property order carries no meaning in XML and `Gtk.Builder`
// ignores it, so an extractor that depends on it turns a legitimate emitter
// refactor into a red build.
const BLOCK_CODE_UI_OBJECT = /<object class="SourceView"[^>]*>([\s\S]*?)<\/object>/g;
const CODE_PROPERTY = /<property name="code">([\s\S]*?)<\/property>/;

/** Resolves the five predefined entities and numeric character references. */
function unescapeXml(text) {
  return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (_, reference) => {
    const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[reference];
    if (named) return named;
    const code = reference[1] === "x" ? parseInt(reference.slice(2), 16) : Number(reference.slice(1));
    return String.fromCodePoint(code);
  });
}

/**
 * Index of the `>` that closes the tag starting at `start`, ignoring any `>`
 * inside a quoted attribute value.
 */
function findTagEnd(source, start) {
  let quote = null;
  for (let index = start + 1; index < source.length; index++) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = null;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === ">") {
      return index;
    }
  }
  return -1;
}

/**
 * Reads the attributes of a start tag, reporting anything the attribute grammar
 * does not account for.
 *
 * An unquoted or unterminated value is the shape that silently swallows the
 * rest of the document, so what is left over after removing every recognised
 * attribute has to be whitespace and nothing else.
 */
function parseAttributes(attributeList) {
  const attributes = new Map();
  let remainder = attributeList;
  for (const match of attributeList.matchAll(ATTRIBUTE)) {
    attributes.set(match[1], match[2] ?? match[3]);
    remainder = remainder.replace(match[0], "");
  }
  return { attributes, malformed: remainder.trim().length > 0 };
}

/**
 * Walks `source` as markup, reporting every shape the target parser rejects and
 * returning the elements it found.
 *
 * Hand-written because the toolchain ships no XML parser that runs under both
 * Node and GJS, and because one scan has to feed the well-formedness rule, the
 * vocabulary rule and the attribute rules at once: a tag the balance check
 * accepts but the vocabulary check never sees is a gap wide enough to walk an
 * unknown widget through.
 *
 * `fragment` allows text and several elements at the top level, which is what a
 * `Gtk.Label` markup string is; a document must have exactly one root element.
 * `tagAttributes` of `"any"` skips attribute validation — XML places no
 * restriction on attribute names, while Pango accepts them only on `<a>`.
 */
function scanMarkup(source, { tags = null, tagAttributes = "any", fragment = false } = {}) {
  const errors = [];
  const elements = [];
  const stack = [];
  let roots = 0;
  let index = 0;

  const scanText = (text) => {
    for (let at = text.indexOf("&"); at !== -1; at = text.indexOf("&", at + 1)) {
      if (!ENTITY.test(text.slice(at))) errors.push(`unknown entity or unescaped &: ${clip(text.slice(at, at + 16))}`);
    }
  };

  while (index < source.length) {
    const start = source.indexOf("<", index);
    if (start === -1) {
      scanText(source.slice(index));
      break;
    }
    scanText(source.slice(index, start));

    // The XML declaration and comments carry nothing the rules below need, but
    // they have their own terminators and would otherwise scan as a malformed
    // start tag.
    if (source.startsWith("<?", start) || source.startsWith("<!--", start)) {
      const terminator = source.startsWith("<?", start) ? "?>" : "-->";
      const end = source.indexOf(terminator, start);
      if (end === -1) {
        errors.push(`unterminated ${terminator === "?>" ? "declaration" : "comment"}`);
        break;
      }
      index = end + terminator.length;
      continue;
    }

    const end = findTagEnd(source, start);
    if (end === -1) {
      errors.push(`unterminated tag: ${clip(source.slice(start, start + 40))}`);
      break;
    }
    const token = source.slice(start, end + 1);
    index = end + 1;

    const close = /^<\/([a-zA-Z_:][\w.:-]*)\s*>$/.exec(token);
    if (close) {
      if (stack.pop() !== close[1]) errors.push(`unbalanced </${close[1]}>`);
      continue;
    }

    const open = /^<([a-zA-Z_:][\w.:-]*)([\s\S]*?)(\/?)>$/.exec(token);
    if (!open) {
      errors.push(`malformed tag: ${clip(token)}`);
      continue;
    }

    const [, name, attributeList, selfClosing] = open;
    const { attributes, malformed } = parseAttributes(attributeList);
    if (malformed) errors.push(`unquoted or malformed attribute in <${name}>: ${clip(attributeList.trim())}`);
    if (tags && !tags.has(name)) errors.push(`unsupported element: <${name}>`);

    if (tagAttributes !== "any") {
      const rules = tagAttributes[name];
      for (const attribute of attributes.keys()) {
        if (!rules?.allowed.has(attribute)) errors.push(`<${name}> does not support the ${attribute} attribute`);
      }
      for (const attribute of rules?.required ?? []) {
        if (!attributes.has(attribute)) errors.push(`<${name}> is missing the ${attribute} attribute`);
      }
    }

    elements.push({ name, attributes });
    if (stack.length === 0) roots++;
    if (!selfClosing) stack.push(name);
  }

  for (const name of stack) errors.push(`unclosed <${name}>`);
  if (!fragment && roots !== 1) errors.push(`expected exactly one root element, found ${roots}`);
  return { errors, elements };
}

function clip(text) {
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
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

function read(name) {
  return readFileSync(`${DIST}/${name}`, "utf8");
}

/** The translatable labels of one GtkBuilder document. */
function translatableLabels(ui) {
  return [...ui.matchAll(TRANSLATABLE_LABEL)].map(([, , body]) => unescapeXml(body));
}

/**
 * The label markup must be markup Pango accepts.
 *
 * `Gtk.Label` with `use-markup` renders an empty string when parsing fails, so
 * an entity Pango does not know costs the reader the whole paragraph and
 * nothing reports it. Measured against Pango 1.57: `&ndash;` and `&times;` both
 * fail with "entity name is not known", while the literal characters `–` and
 * `×` parse — which is what the MDX has to contain.
 */
function labelMarkupErrors(markup) {
  return scanMarkup(markup, { tags: LABEL_TAGS, tagAttributes: LABEL_TAG_ATTRIBUTES, fragment: true }).errors;
}

/**
 * Block-code literals of a GtkBuilder document, with the number of
 * `SourceView` objects they came from.
 *
 * The two numbers are reported separately because an editor widget with no
 * code in it is a defect no comparison can see: it removes the literal from
 * both sides at once.
 */
function uiBlockCode(ui) {
  const objects = [...ui.matchAll(BLOCK_CODE_UI_OBJECT)];
  const codes = objects
    .map((object) => CODE_PROPERTY.exec(object[1]))
    .filter((code) => code !== null)
    .map((code) => unescapeXml(code[1]));
  return { objects: objects.length, codes };
}

/**
 * What `xgettext` takes from a `.blp`: every marked string, in source order,
 * with the line above it that becomes its translator comment.
 *
 * Deliberately a separate reader from the blueprint compiler's: what reaches
 * the catalogs is what the extractor's JavaScript scanner sees in the file,
 * not what the compiler understood. `--language=JavaScript` is what
 * `@gjsify/vite-plugin-gettext` passes for a `.blp` (0.26 rejects
 * `--language=Blueprint`), so a `_("…")` the compiler ignores would still be
 * extracted, and a string the compiler translates through some other spelling
 * would not be.
 *
 * `comment` is the whole previous line rather than the text after `//`,
 * because that is the granularity `--add-comments` works at: a comment is
 * attached only when it sits on its own line directly above the keyword.
 */
function blueprintTranslations(blueprint) {
  const found = [];
  for (const match of blueprint.matchAll(/\b_\(("(?:[^"\\]|\\.)*")\)/g)) {
    // The slice ends mid-line, at `label: _(`, so the last entry is the
    // keyword's own line and the one before it is the candidate comment.
    const above = blueprint.slice(0, match.index).split("\n");
    found.push({
      msgid: match[1]
        .slice(1, -1)
        .replace(/\\(n|t|r|\\|")/g, (_, escape) => ({ n: "\n", t: "\t", r: "\r", "\\": "\\", '"': '"' })[escape]),
      comment: above[above.length - 2]?.trim() ?? "",
    });
  }
  return found;
}

/**
 * Fragments every rule must classify correctly, checked before any artifact is
 * read.
 *
 * A structural check that has quietly stopped biting is worse than no check: it
 * reports success over output nobody has looked at. The rejected shapes are the
 * ones the respective parser refuses; the accepted ones are output the emitter
 * legitimately produces today.
 */
const SELF_TEST = [
  ["label", "Use <tt>LDA</tt> and <b>Step</b>", "accept"],
  ["label", 'See <a href="https://en.wikipedia.org/wiki/MOS_Technology_6502">the 6502</a>.', "accept"],
  ["label", "A &amp; B, 32 × 8 pixels, range 0–255", "accept"],
  ["label", "numeric character reference: &#215;", "accept"],
  ["label", "range of 0&ndash;255", "reject"],
  ["label", "32 &times; 8 pixels", "reject"],
  ["label", "A &nbsp; B", "reject"],
  ["label", "A & B", "reject"],
  ["label", "<b>bold<i>italic</b></i>", "reject"],
  ["label", "<blink>no such tag</blink>", "reject"],
  ["label", "<a>no href</a>", "reject"],
  ["label", '<tt class="c">LDA</tt>', "reject"],
  ["label", "<tt>unclosed", "reject"],
  ["document", '<?xml version="1.0"?><interface><requires lib="gtk"></requires></interface>', "accept"],
  ["document", "<interface><child></child><child></child></interface>", "accept"],
  ["document", "<interface></interface><interface></interface>", "reject"],
  ["document", "<interface><child></interface>", "reject"],
  ["document", "<interface><property name=unquoted></property></interface>", "reject"],
  ["document", "<interface>a & b</interface>", "reject"],
];

/**
 * Extractors run over shapes the emitter is allowed to produce.
 *
 * The markup rules have SELF_TEST; the extractors had nothing, and an extractor
 * that quietly matches less than it should is the worse failure: it does not
 * report anything, it shrinks the reference set the comparison is made against.
 * Property order is the concrete case — XML gives it no meaning, so the emitter
 * may reorder freely and the extraction has to survive it.
 */
const EXTRACTION_TEST = [
  [
    "block code is found whatever order the object's properties are in",
    () =>
      [
        '<property name="code">LDA #$01</property><property name="language">6502</property>',
        '<property name="language">6502</property><property name="code">LDA #$01</property>',
      ]
        .map((properties) => uiBlockCode(`<object class="SourceView" id="a">${properties}</object>`))
        .every((found) => found.objects === 1 && found.codes.join() === "LDA #$01"),
  ],
  [
    "an editor with no code is counted but yields no literal",
    () => {
      const found = uiBlockCode('<object class="SourceView" id="a"><property name="language">6502</property></object>');
      return found.objects === 1 && found.codes.length === 0;
    },
  ],
  [
    "the msgid reader resolves the escapes a blueprint literal may carry",
    () =>
      blueprintTranslations('label: _("a \\"q\\" \\\\ b\\nc");')
        .map((translation) => translation.msgid)
        .join("|") === 'a "q" \\ b\nc' && blueprintTranslations('code: "not translatable";').length === 0,
  ],
  [
    // The keyword sits mid-line, after `label: `, so a reader that takes the
    // last line before it reads the string's own line and never sees a
    // comment — which reports every label in both documents as uncommented.
    "the comment is read from the line above the keyword, not from its own line",
    () =>
      blueprintTranslations('  // TRANSLATORS: from the MDX\n  label: _("Introduction");')[0]?.comment ===
        "// TRANSLATORS: from the MDX" && blueprintTranslations('  label: _("Introduction");')[0]?.comment === "",
  ],
];

/**
 * Conversions `uiToBlueprint` must get right, run before any artifact is read.
 *
 * The converter is the one piece of this pipeline with no second implementation
 * to disagree with it: `tsx/index.tsx` checks each document against the XML it
 * was rendered from, but only for the shapes that document happens to contain.
 * These are the shapes that cost a paragraph when they go wrong and that the
 * two MDX files do not necessarily exercise.
 */
const CONVERSION_TEST = [
  [
    "a label that talks about markup keeps its escaped entity",
    // `&amp;lt;` is what the tutorial's prose about `<` renders to. Resolving
    // the entities in two passes would turn it into a literal `<` and Pango
    // would read the paragraph as a malformed tag.
    '<property name="label" translatable="yes">write &amp;lt; as &amp;amp;lt;</property>',
    'label: _("write &lt; as &amp;lt;");',
  ],
  ["a non-translatable label is a plain string", '<property name="label">1. </property>', 'label: "1. ";'],
  // The nick, not the member's number: GtkBuilder resolves both, the
  // NativeScript port only the nick. Bare, not quoted — an enum value is an
  // identifier in blueprint, and quoting it would claim the property is a
  // string. `tsx/enums/gtk.enums.ts` records the blank screen that proved it.
  ["an enum value is the GTK nick, spelled bare", '<property name="valign">baseline</property>', "valign: baseline;"],
  [
    "a value that is not a member of the enum stops the build",
    '<property name="halign">5</property>',
    { refuses: "not a halign member" },
  ],
  ["a boolean stays a boolean", '<property name="wrap">true</property>', "wrap: true;"],
  [
    "a code literal keeps its newlines as escapes",
    '<property name="code">LDA #$01\nSTA $0200</property>',
    'code: "LDA #$01\\nSTA $0200";',
  ],
  [
    "a widget blueprint has no introspection for is an extern type",
    '<child><object class="SourceView" id="sourceView0"><property name="language">6502</property></object></child>',
    "$SourceView sourceView0 {",
  ],
  ["a known GTK class is named, not externed", '<child><object class="GtkBox"></object></child>', "Gtk.Box {"],
];

/** A minimal rendered document with `body` inside the template's box. */
function conversionFixture(body) {
  return (
    '<?xml version="1.0" encoding="UTF-8"?><interface><requires lib="gtk" version="4.0"/>' +
    '<template class="TutorialView" parent="MdxView"><child><object class="GtkBox">' +
    `${body}</object></child></template></interface>`
  );
}

/** Self-test results that came out the wrong way round. */
function selfTestFailures() {
  const wrong = [];
  for (const [kind, source, expected] of SELF_TEST) {
    const errors = kind === "label" ? labelMarkupErrors(source) : scanMarkup(source).errors;
    const verdict = errors.length ? "reject" : "accept";
    if (verdict !== expected)
      wrong.push(`expected to ${expected}: ${clip(source)} (${errors.join("; ") || "no problem reported"})`);
  }
  for (const [what, body, expected] of CONVERSION_TEST) {
    // A string `expected` has to appear in the blueprint; a `{ refuses }` one
    // has to appear in the error instead, because a shape the converter must
    // not guess at is as much a rule as a shape it must emit.
    const refusal = typeof expected === "string" ? undefined : expected.refuses;
    let produced;
    try {
      produced = uiToBlueprint(conversionFixture(body));
    } catch (error) {
      if (!refusal) wrong.push(`conversion threw on ${what}: ${error.message}`);
      else if (!error.message.includes(refusal))
        wrong.push(`conversion refused ${what} for the wrong reason: ${error.message}`);
      continue;
    }
    if (refusal) wrong.push(`conversion no longer refuses ${what}`);
    else if (!produced.includes(expected))
      wrong.push(`conversion no longer holds — ${what}: expected ${clip(expected)}`);
  }
  return wrong;
}

function check() {
  const selfTest = [
    ...selfTestFailures(),
    ...EXTRACTION_TEST.filter(([, holds]) => !holds()).map(([what]) => `extraction no longer holds: ${what}`),
  ];
  if (selfTest.length) {
    console.error("The structural rules no longer classify their own test cases:");
    for (const failure of selfTest) console.error(`  ${failure}`);
    return 1;
  }

  // Rule 1 — the emitter wrote every artifact its consumers import.
  // A missing file is the one failure that would let every rule below pass by
  // reading nothing, so it is checked first and aborts the run.
  const artifacts = DOCUMENTS.map((document) => `${document}.blp`);
  const absent = artifacts.filter((name) => !existsSync(`${DIST}/${name}`));
  if (absent.length) {
    console.error(`${DIST}/ is missing ${absent.length} artifact(s): ${absent.join(", ")}`);
    console.error("Run `gjsify workspace @learn6502/learn build` first.");
    return 1;
  }

  const failures = [];
  const report = (where, problems) => {
    for (const problem of problems) failures.push({ where, problem });
  };

  for (const document of DOCUMENTS) {
    const blueprint = read(`${document}.blp`);

    // The compiled XML, not the `.blp`, is what every rule below reads: it is
    // what the three platforms hand to their builder, and the step that
    // produces it is the one the apps cannot check for themselves. A blueprint
    // that no longer compiles fails the whole document, which is exactly what
    // it would do at import time on all three platforms at once.
    let ui;
    try {
      ui = emitGtkBuilderXml(parseBlueprint(blueprint, { path: `${DIST}/${document}.blp` }));
    } catch (error) {
      report(`${document}.blp`, [`does not compile: ${error.message}`]);
      continue;
    }

    // Rule 2 — the compiled XML is well-formed, has the expected root, and
    // contains only elements its consumer can resolve. `Gtk.Builder` and the
    // web and NativeScript builders all refuse the whole document on a parse
    // error, so this is the difference between one broken paragraph and a
    // blank screen.
    const scan = scanMarkup(ui, { tags: VOCABULARY.elements });
    report(`${document}.blp`, scan.errors);
    if (scan.elements[0]?.name !== VOCABULARY.root)
      report(`${document}.blp`, [`root element is <${scan.elements[0]?.name}>, expected <${VOCABULARY.root}>`]);

    // Rule 3 — every object class the compiled XML names is one the apps can
    // resolve. A builder fails on an unknown GType, and it is not the emitter
    // that finds out: the app is.
    for (const element of scan.elements) {
      const objectClass = element.name === "object" ? element.attributes.get("class") : null;
      if (objectClass && !VOCABULARY.objectClasses.has(objectClass))
        report(`${document}.blp`, [`unknown object class: ${objectClass}`]);
    }

    const labels = translatableLabels(ui);
    if (!labels.length) report(`${document}.blp`, ["no translatable labels — the renderer produced no text"]);

    // Rule 4 — the strings the catalogs get are the strings the apps render.
    // The two halves of a translated label travel separately: `xgettext` reads
    // the `.blp` to build the POT, while the apps look up the compiled XML's
    // `translatable="yes"` text at runtime. A spelling that shifts one without
    // the other is not a broken build — it is a msgid that no catalog has a
    // translation for, so the string renders in English for all 16 languages
    // and the POT shows nothing wrong. This is what the old cross-target
    // comparison protected by accident; here it is the rule.
    const translations = blueprintTranslations(blueprint);
    const msgids = { blp: count(translations.map((translation) => translation.msgid)), ui: count(labels) };
    report(
      document,
      missing(msgids.blp, msgids.ui).map((text) => `extracted for translation but not in the view: ${clip(text)}`)
    );
    report(
      document,
      missing(msgids.ui, msgids.blp).map((text) => `translated at runtime but never extracted: ${clip(text)}`)
    );

    // Rule 5 — every translatable string carries its translator comment.
    // `comments=` is a GtkBuilder attribute blueprint does not carry into its
    // output, so the comment has to be a `//` line directly above the `_()`
    // for bare `--add-comments` to attach it. It is the only context a
    // translator gets: the catalogs are generated with `noLocation`, so
    // without it the string arrives with no provenance at all. Read off the
    // `.blp` in source order — the file and the order the extractor works in —
    // rather than looked up by msgid, because the same text may legitimately
    // appear twice and a lookup would then check one occurrence twice.
    for (const { msgid, comment } of translations) {
      if (!comment.startsWith("// TRANSLATORS:"))
        report(`${document}.blp`, [`translatable label without a TRANSLATORS comment: ${clip(msgid)}`]);
    }

    // Rule 6 — the label markup parses as Pango markup. Against the compiled
    // XML, because that is the string `Gtk.Label` is handed.
    for (const label of labels) {
      for (const error of labelMarkupErrors(label))
        report(`${document}.blp`, [`unrenderable label markup — ${error}: ${clip(label)}`]);
    }

    // Rule 7 — every editor widget carries the code it is there to show.
    // The literals are what the reader retypes into the emulator, and an empty
    // `SourceView` is the one loss no other rule here can see: it takes the
    // literal out of every set that would be compared against it.
    const editors = uiBlockCode(ui);
    if (editors.objects !== editors.codes.length)
      report(`${document}.blp`, [
        `${editors.objects - editors.codes.length} SourceView object(s) without a code property`,
      ]);
  }

  for (const { where, problem } of failures) console.error(`${where}: ${problem}`);

  if (failures.length) {
    console.error(`\n${failures.length} problem(s) in the generated artifacts.`);
    return 1;
  }

  console.log(
    `All generated artifacts passed structural validation (${DOCUMENTS.length} documents, ` +
      `${SELF_TEST.length + EXTRACTION_TEST.length + CONVERSION_TEST.length} self-test cases).`
  );
  return 0;
}

const status = check();
// `gjsify run` keeps the GJS main loop alive, so signal the result explicitly.
if (status !== 0) throw new Error("learn artifact check failed");
