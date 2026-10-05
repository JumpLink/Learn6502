/**
 * Structural validation for the generated tutorial artifacts.
 *
 * One MDX source is rendered into three unrelated targets — `dist/*.ui` for
 * app-gnome, `dist/*.ns.xml` for app-android, `dist/*.html` for app-web — and
 * nothing downstream reads all three. A renderer change that breaks only one of
 * them therefore reaches `main` looking green: the GNOME app is the only
 * consumer that fails loudly, and it fails at runtime, in whatever paragraph
 * the reader happens to open.
 *
 * The rules below are structural on purpose. A byte snapshot of a 136 KB
 * generated file is a diff nobody reads and everybody regenerates, so it stops
 * being evidence the first time someone reformats the emitter. What is asserted
 * here is what the three consumers actually require, and every rule names the
 * damage it prevents.
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

// The package directory, which is where `gjsify workspace` runs a script from.
// Deliberately not derived from `import.meta.url`: the `--app gjs` target runs
// a bundle written to `dist/`, so a script-relative path would resolve one
// directory too deep and the run would report success having read nothing.
const DIST = "dist";

/** The MDX documents rendered by `tsx/index.tsx`, each into all three targets. */
const DOCUMENTS = ["tutorial", "quick-help"];

/**
 * The element vocabulary each target may contain.
 *
 * These are allow-lists, not descriptions: a new element in a generated file is
 * a claim that the consumer can render it, and that claim only becomes true
 * once someone has taught the consumer about it. app-gnome loads the `.ui`
 * through `Gtk.Builder`, which fails the whole view on an object class it
 * cannot resolve, and NativeScript's `Builder.load` does the same for the
 * `.ns.xml`. So growing this list is a deliberate act, paired with the widget
 * that handles the new element.
 */
const VOCABULARY = {
  ui: {
    root: "interface",
    elements: new Set(["interface", "requires", "template", "child", "object", "property", "style", "class"]),
    // `SourceView` is app-gnome's own widget (`packages/app-gnome/src/widgets`),
    // not a GTK class — it resolves because the app registers its GType before
    // the builder runs.
    objectClasses: new Set(["GtkBox", "GtkLabel", "SourceView"]),
  },
  ns: {
    root: "StackLayout",
    elements: new Set(["StackLayout", "HtmlView", "w:SourceView"]),
  },
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
// refactor into a red build — and, worse, reports the loss against the *other*
// targets, which are the ones that did not change.
const BLOCK_CODE_UI_OBJECT = /<object class="SourceView"[^>]*>([\s\S]*?)<\/object>/g;
const CODE_PROPERTY = /<property name="code">([\s\S]*?)<\/property>/;
const INLINE_CODE_LABEL = /<tt>([\s\S]*?)<\/tt>/g;
const INLINE_CODE_HTML = /<code[^>]*>([\s\S]*?)<\/code>/g;
const BLOCK_CODE_HTML = /<adw-source-view\b[^>]*?\scode="([^"]*)"/g;
/** The elements `html.components.tsx` renders prose into, each a `.ui` label. */
const HTML_TEXT_BLOCK = /<(p|h1|h2|h3|h4|li)\b[^>]*>([\s\S]*?)<\/\1>/g;
const HTML_ATTRIBUTE = /\bhtml="([^"]*)"/g;
const SOURCE_VIEW_CODE = /<w:SourceView\b[^>]*?\scode="([^"]*)"/g;

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

/** The translatable labels of one `.ui`, with their xgettext comment. */
function translatableLabels(ui) {
  return [...ui.matchAll(TRANSLATABLE_LABEL)].map(([, attributes, body]) => ({
    comment: /comments="([^"]*)"/.exec(attributes)?.[1] ?? null,
    markup: unescapeXml(body),
  }));
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

/** Readable text of a markup fragment, normalised for comparison across targets. */
function plainText(markup) {
  return unescapeXml(markup.replace(/<[^>]*>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Block-code literals of a `.ui`, with the number of `SourceView` objects they
 * came from.
 *
 * The two numbers are reported separately because an editor widget with no code
 * in it is a defect the comparison against the other targets cannot see: it
 * removes the literal from both sides at once.
 */
function uiBlockCode(ui) {
  const objects = [...ui.matchAll(BLOCK_CODE_UI_OBJECT)];
  const codes = objects
    .map((object) => CODE_PROPERTY.exec(object[1]))
    .filter((code) => code !== null)
    .map((code) => unescapeXml(code[1]));
  return { objects: objects.length, codes };
}

/** The prose of a `.ui`, one entry per translatable label. */
function uiProse(ui) {
  return translatableLabels(ui).map((label) => plainText(label.markup));
}

/** The prose of an `.html`, one entry per rendered text block. */
function htmlProse(html) {
  return [...html.matchAll(HTML_TEXT_BLOCK)].map((match) => plainText(match[2])).filter(Boolean);
}

/** Inline and block code literals as they reach each of the three targets. */
function codeLiterals(document) {
  const ui = read(`${document}.ui`);
  const ns = read(`${document}.ns.xml`);
  const html = read(`${document}.html`);

  return {
    ui: {
      inline: translatableLabels(ui).flatMap((label) =>
        [...label.markup.matchAll(INLINE_CODE_LABEL)].map((match) => unescapeXml(match[1]))
      ),
      block: uiBlockCode(ui).codes,
    },
    ns: {
      // Inline code is escaped inside the `html` attribute of an `HtmlView`;
      // block code is a `w:SourceView` element of its own.
      inline: [...ns.matchAll(HTML_ATTRIBUTE)].flatMap((match) =>
        [...unescapeXml(match[1]).matchAll(SOURCE_VIEW_CODE)].map((code) => unescapeXml(code[1]))
      ),
      block: [...ns.matchAll(SOURCE_VIEW_CODE)].map((match) => unescapeXml(match[1])),
    },
    html: {
      inline: [...html.matchAll(INLINE_CODE_HTML)].map((match) => unescapeXml(match[1])),
      block: [...html.matchAll(BLOCK_CODE_HTML)].map((match) => unescapeXml(match[1])),
    },
  };
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
  ["a label's prose survives its markup", () => plainText("Use <tt>LDA</tt>\n and <b>Step</b>") === "Use LDA and Step"],
  [
    "prose is found under every element the html target renders text into",
    () =>
      htmlProse('<h2 class="t">Registers</h2><p>The <code>A</code> register</p><ul><li>one</li></ul>').join("|") ===
      "Registers|The A register|one",
  ],
];

/** Self-test results that came out the wrong way round. */
function selfTestFailures() {
  const wrong = [];
  for (const [kind, source, expected] of SELF_TEST) {
    const errors = kind === "label" ? labelMarkupErrors(source) : scanMarkup(source).errors;
    const verdict = errors.length ? "reject" : "accept";
    if (verdict !== expected)
      wrong.push(`expected to ${expected}: ${clip(source)} (${errors.join("; ") || "no problem reported"})`);
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

  // Rule 1 — the emitter wrote every artifact its three consumers import.
  // A missing file is the one failure that would let every rule below pass by
  // reading nothing, so it is checked first and aborts the run.
  const artifacts = DOCUMENTS.flatMap((document) => [`${document}.ui`, `${document}.ns.xml`, `${document}.html`]);
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
    const ui = read(`${document}.ui`);
    const ns = read(`${document}.ns.xml`);

    // Rule 2 — the `.ui` and `.ns.xml` are well-formed XML with the expected
    // root, and contain only elements their consumer can resolve. `Gtk.Builder`
    // and NativeScript's `Builder.load` both refuse the whole document on a
    // parse error, so this is the difference between one broken paragraph and a
    // blank screen.
    for (const [name, source, vocabulary] of [
      [`${document}.ui`, ui, VOCABULARY.ui],
      [`${document}.ns.xml`, ns, VOCABULARY.ns],
    ]) {
      const scan = scanMarkup(source, { tags: vocabulary.elements });
      report(name, scan.errors);
      if (scan.elements[0]?.name !== vocabulary.root)
        report(name, [`root element is <${scan.elements[0]?.name}>, expected <${vocabulary.root}>`]);

      // Rule 3 — every object class the `.ui` names is one app-gnome can
      // resolve. `Gtk.Builder` fails on an unknown GType, and it is not the
      // emitter that finds out: the app is.
      for (const element of scan.elements) {
        const objectClass = element.name === "object" ? element.attributes.get("class") : null;
        if (objectClass && !vocabulary.objectClasses?.has(objectClass))
          report(name, [`unknown object class: ${objectClass}`]);
      }
    }

    const labels = translatableLabels(ui);
    if (!labels.length) report(`${document}.ui`, ["no translatable labels — the renderer produced no text"]);

    // Rule 4 — the `.ui` carries every paragraph the `.html` does.
    // The `.ui` is what `xgettext` extracts the catalogs from, so prose that
    // stops reaching it is a string that stops existing for every translator,
    // and neither the catalogs nor any other rule here can miss what is no
    // longer there. The `.html` is the independent witness: it is rendered from
    // the same MDX in the same run, so the two have to agree paragraph for
    // paragraph. (The `.ns.xml` is not usable for this — it groups list items
    // into one `HtmlView`, so it has no per-paragraph structure to compare.)
    const prose = { ui: count(uiProse(ui)), html: count(htmlProse(read(`${document}.html`))) };
    report(
      document,
      missing(prose.html, prose.ui).map((text) => `paragraph rendered to html but not to the .ui: ${clip(text)}`)
    );
    report(
      document,
      missing(prose.ui, prose.html).map((text) => `paragraph rendered to the .ui but not to html: ${clip(text)}`)
    );

    for (const label of labels) {
      // Rule 5 — every translatable string carries its translator comment.
      // xgettext copies `comments=` into the POT as the `#.` line, which is the
      // only context a translator gets: the catalogs are generated with
      // `noLocation`, so without it the string arrives with no provenance at
      // all.
      if (!label.comment?.startsWith("TRANSLATORS:"))
        report(`${document}.ui`, [`translatable label without a TRANSLATORS comment: ${clip(label.markup)}`]);

      // Rule 6 — the label markup parses as Pango markup.
      for (const error of labelMarkupErrors(label.markup))
        report(`${document}.ui`, [`unrenderable label markup — ${error}: ${clip(label.markup)}`]);
    }

    // Rule 7 — the same code literals reach all three targets.
    // They are what the reader retypes into the editor, and each target encodes
    // them differently (`<tt>` on GTK, an escaped `w:SourceView` on
    // NativeScript, `<code>` on the web), so a renderer change that drops or
    // mangles one of them shows up nowhere else.
    const literals = codeLiterals(document);

    // An editor widget with no code in it is invisible to the comparison below,
    // because it removes the literal from the `.ui` reference set and from the
    // target at the same time.
    const editors = uiBlockCode(ui);
    if (editors.objects !== editors.codes.length)
      report(`${document}.ui`, [
        `${editors.objects - editors.codes.length} SourceView object(s) without a code property`,
      ]);

    for (const kind of ["inline", "block"]) {
      const reference = count(literals.ui[kind]);
      for (const target of ["ns", "html"]) {
        const actual = count(literals[target][kind]);
        report(
          `${document} (${kind} code)`,
          missing(reference, actual).map((literal) => `missing from the ${target} target: ${clip(literal)}`)
        );
        report(
          `${document} (${kind} code)`,
          missing(actual, reference).map((literal) => `only in the ${target} target: ${clip(literal)}`)
        );
      }
    }
  }

  for (const { where, problem } of failures) console.error(`${where}: ${problem}`);

  if (failures.length) {
    console.error(`\n${failures.length} problem(s) in the generated artifacts.`);
    return 1;
  }

  console.log(
    `All generated artifacts passed structural validation (${DOCUMENTS.length} documents × 3 targets, ` +
      `${SELF_TEST.length + EXTRACTION_TEST.length} self-test cases).`
  );
  return 0;
}

const status = check();
// `gjsify run` keeps the GJS main loop alive, so signal the result explicitly.
if (status !== 0) throw new Error("learn artifact check failed");
