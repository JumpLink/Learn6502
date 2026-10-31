/**
 * Turns the GtkBuilder XML that `components/gtk` renders into a Blueprint file.
 *
 * The three platforms used to read three unrelated artifacts rendered from the
 * same MDX; they now read one `dist/*.blp`, compiled by
 * `@gjsify/vite-plugin-blueprint` at the point of import. That makes the
 * generator's job "emit blueprint" — but not by way of blueprint-emitting JSX
 * components: `renderSSR` escapes text at every nesting level it passes
 * through, so a component tree that produced blueprint string literals would
 * escape each paragraph once per wrapper, and the msgids are what would change.
 * Rendering to XML first keeps today's known-correct escaping, which is the
 * whole reason the 224 msgids survive this change byte for byte.
 *
 * So the XML is an intermediate value, not an artifact: `tsx/index.tsx` renders
 * it in memory and passes it straight to {@link uiToBlueprint}.
 *
 * The reader below is a subset reader, not an XML parser. It accepts the eight
 * element names the renderer emits, double-quoted attributes, and text only
 * inside `<property>`; anything else throws. Two reasons it is written by hand:
 * the toolchain ships no XML parser that runs under both Node and GJS (the
 * build runs under GJS, where `@gjsify/dom-elements` exposes no `DOMParser`,
 * and `fast-xml-parser` & co. are only transitive dependencies), and the input
 * is produced by the emitter two directories over — so the narrow grammar is a
 * description of that emitter, and a violation of it is a change in the
 * emitter that someone has to look at.
 */

import { emitGtkBuilderXml, parseBlueprint } from "@gjsify/blueprint";

import { Align, Justification, Orientation } from "./enums/gtk.enums.ts";

/** XML `lib` attribute to the blueprint namespace that imports it. */
const REQUIRES: Record<string, string> = { gtk: "Gtk" };

/**
 * Object classes blueprint has introspection data for.
 *
 * Everything else is an `extern` type — a widget the app registers its GType
 * for before the builder runs — and is named with a `$`, which is what tells
 * blueprint to pass its properties through without resolving them.
 */
const GTK_CLASSES: Record<string, string> = {
  GtkBox: "Gtk.Box",
  GtkLabel: "Gtk.Label",
};

/**
 * Properties whose value is a string literal rather than a scalar.
 *
 * An allow-list rather than a guess at the value's shape: `code: "0"` is a
 * one-line program and `height: 0` is a number, and nothing in the XML tells
 * them apart. A property that is neither listed here nor scalar-shaped stops
 * the build instead of being emitted as whichever of the two happens to parse.
 */
const STRING_PROPERTIES = new Set(["label", "code", "language"]);

/**
 * Properties whose value is an enum nick, and the nicks each one accepts.
 *
 * Blueprint writes the token back out verbatim, so what lands in the compiled
 * XML is the nick the renderer chose — and the member list is checked here
 * rather than there, because a typo in a nick is a string either way and only
 * this table knows which strings the type has. An unlisted property keeps the
 * old treatment: scalar or nothing.
 */
const ENUM_PROPERTIES: Record<string, ReadonlySet<string>> = {
  halign: new Set(Object.values(Align)),
  valign: new Set(Object.values(Align)),
  justify: new Set(Object.values(Justification)),
  orientation: new Set(Object.values(Orientation)),
};

/** Boolean, integer and float property values, which blueprint spells as-is. */
const SCALAR = /^(?:true|false|-?\d+(?:\.\d+)?)$/;

/** Elements the GTK renderer emits, and the only ones this reader accepts. */
const ELEMENTS = new Set(["interface", "requires", "template", "child", "object", "property", "style", "class"]);

const START_TAG = /^<([a-z]+)((?:\s+[a-z-]+="[^"]*")*)\s*(\/?)>/;
const END_TAG = /^<\/([a-z]+)>/;
const ATTRIBUTE = /([a-z-]+)="([^"]*)"/g;

interface UiElement {
  readonly name: string;
  readonly attributes: Map<string, string>;
  readonly children: UiElement[];
  text: string;
}

function clip(text: string): string {
  return text.length > 70 ? `${text.slice(0, 70)}…` : text;
}

/**
 * Resolves the five predefined entities and numeric character references in
 * one pass.
 *
 * One pass is the point. Sequential replaces corrupt `&amp;lt;` — the shape a
 * paragraph that talks *about* markup has — because resolving `&amp;` first
 * leaves `&lt;` for the next replace to resolve again, and the reader would
 * hand blueprint a `<` where the label wants a literal `&lt;`.
 */
function unescapeXml(text: string): string {
  return text.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, (_match, reference: string) => {
    const named = ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[reference];
    if (named) return named;
    const code = reference[1] === "x" ? parseInt(reference.slice(2), 16) : Number(reference.slice(1));
    return String.fromCodePoint(code);
  });
}

/** A blueprint string literal holding `text` verbatim. */
function blueprintString(text: string): string {
  // Backslash and quote first: escaping the newline produces a backslash, and
  // a second pass over it would double that one too.
  const escaped = text.replace(/[\\"]/g, "\\$&").replace(/\n/g, "\\n");
  // Finding a control character IS the check: blueprint has no escape for one, so it would be
  // written raw into the literal and read back as something else.
  // eslint-disable-next-line no-control-regex
  const control = /[\x00-\x09\x0b-\x1f]/.exec(escaped);
  if (control) throw new Error(`control character U+${control[0].codePointAt(0)!.toString(16)} in a string literal`);
  return `"${escaped}"`;
}

function parseUi(source: string): UiElement {
  let rest = source;
  if (rest.startsWith("<?")) {
    const end = rest.indexOf("?>");
    if (end === -1) throw new Error("unterminated XML declaration");
    rest = rest.slice(end + 2);
  }

  const stack: UiElement[] = [];
  let root: UiElement | undefined;

  while (rest.length > 0) {
    if (rest[0] !== "<") {
      // Text never contains `<`: the renderer escapes it, so the next `<` is
      // always the start of the next tag.
      const next = rest.indexOf("<");
      const text = next === -1 ? rest : rest.slice(0, next);
      const open = stack[stack.length - 1];
      if (open?.name === "property") open.text += text;
      else if (text.trim().length > 0) throw new Error(`text outside a <property>: ${clip(text)}`);
      rest = next === -1 ? "" : rest.slice(next);
      continue;
    }

    // Comments carry nothing, but blueprint's own emitter writes a
    // "DO NOT EDIT" banner into the compiled XML — which this reader has to get
    // through, because that XML is the second document it reads.
    if (rest.startsWith("<!--")) {
      const close = rest.indexOf("-->");
      if (close === -1) throw new Error("unterminated comment");
      rest = rest.slice(close + 3);
      continue;
    }

    const end = END_TAG.exec(rest);
    if (end) {
      const closed = stack.pop();
      if (closed?.name !== end[1]) throw new Error(`</${end[1]}> closes <${closed?.name ?? "nothing"}>`);
      rest = rest.slice(end[0].length);
      continue;
    }

    const start = START_TAG.exec(rest);
    if (!start) throw new Error(`unsupported markup: ${clip(rest.slice(0, 80))}`);
    const [token, name, attributeList, selfClosing] = start;
    if (!ELEMENTS.has(name)) throw new Error(`unsupported element: <${name}>`);

    const element: UiElement = { name, attributes: new Map(), children: [], text: "" };
    for (const [, key, value] of attributeList.matchAll(ATTRIBUTE)) element.attributes.set(key, value);

    const parent = stack[stack.length - 1];
    if (parent) parent.children.push(element);
    else if (root) throw new Error("more than one root element");
    else root = element;
    if (!selfClosing) stack.push(element);
    rest = rest.slice(token.length);
  }

  if (stack.length > 0) throw new Error(`unclosed <${stack[stack.length - 1]!.name}>`);
  if (!root) throw new Error("no root element");
  return root;
}

function objectHeader(element: UiElement): string {
  if (element.name === "template") {
    const name = element.attributes.get("class");
    const parent = element.attributes.get("parent");
    if (!name || !parent) throw new Error("<template> needs both a class and a parent");
    return `template $${name}: $${parent}`;
  }
  const objectClass = element.attributes.get("class");
  if (!objectClass) throw new Error("<object> without a class");
  const named = GTK_CLASSES[objectClass] ?? `$${objectClass}`;
  const id = element.attributes.get("id");
  return id ? `${named} ${id}` : named;
}

function emitProperty(element: UiElement, depth: number): string[] {
  const pad = "  ".repeat(depth);
  const name = element.attributes.get("name");
  if (!name) throw new Error("<property> without a name");
  if (element.children.length > 0) throw new Error(`<property name="${name}"> has element content`);

  const translatable = element.attributes.get("translatable");
  if (translatable !== undefined && translatable !== "yes")
    throw new Error(`unsupported translatable="${translatable}" on ${name}`);

  const text = unescapeXml(element.text);

  if (!STRING_PROPERTIES.has(name)) {
    if (translatable === "yes") throw new Error(`${name} is translatable but not a string property`);
    // An enum value is a bare identifier in blueprint, not a quoted string:
    // quoting it would compile to the same XML text but say "string" where the
    // type is an enum, and blueprint would be right to stop reading one day.
    const nicks = ENUM_PROPERTIES[name];
    if (nicks) {
      if (!nicks.has(text))
        throw new Error(`${text} is not a ${name} member — the nicks are ${[...nicks].join(", ")}`);
      return [`${pad}${name}: ${text};`];
    }
    if (!SCALAR.test(text))
      throw new Error(`unsupported value for ${name}: ${clip(text)} — list it in STRING_PROPERTIES or emit a scalar`);
    return [`${pad}${name}: ${text};`];
  }

  const literal = blueprintString(text);
  if (translatable !== "yes") return [`${pad}${name}: ${literal};`];

  const assignment = `${pad}${name}: _(${literal});`;
  const comment = element.attributes.get("comments");
  if (!comment) return [assignment];
  if (comment.includes("\n")) throw new Error(`multi-line translator comment: ${clip(comment)}`);
  // Directly above the `_()` and nowhere else: `comments=` is a GtkBuilder
  // attribute and blueprint does not carry it into the compiled XML, so the
  // translator comment reaches the POT only as a `//` line that bare
  // `--add-comments` can attach to the keyword below it.
  return [`${pad}// ${comment}`, assignment];
}

function emitStyles(element: UiElement, depth: number): string[] {
  const pad = "  ".repeat(depth);
  const names = element.children.map((child) => {
    if (child.name !== "class") throw new Error(`unsupported child of <style>: <${child.name}>`);
    const name = child.attributes.get("name");
    if (!name) throw new Error("<class> without a name");
    return name;
  });
  if (names.length === 0) throw new Error("<style> without a class");
  return [`${pad}styles [`, ...names.map((name) => `${pad}  ${blueprintString(name)},`), `${pad}]`];
}

function emitObject(element: UiElement, depth: number): string[] {
  const pad = "  ".repeat(depth);
  const lines = [`${pad}${objectHeader(element)} {`];
  let emitted = false;

  for (const child of element.children) {
    const block = child.name !== "property";
    if (block && emitted) lines.push("");
    if (child.name === "property") lines.push(...emitProperty(child, depth + 1));
    else if (child.name === "style") lines.push(...emitStyles(child, depth + 1));
    else if (child.name === "child") lines.push(...emitChild(child, depth + 1));
    else throw new Error(`unsupported child of <${element.name}>: <${child.name}>`);
    emitted = true;
  }

  lines.push(`${pad}}`);
  return lines;
}

/** `<child>` carries no blueprint syntax of its own; the object it wraps does. */
function emitChild(element: UiElement, depth: number): string[] {
  if (element.attributes.size > 0)
    throw new Error(`<child> carries unsupported attributes: ${[...element.attributes.keys()].join(", ")}`);
  const [object, ...extra] = element.children;
  if (!object || extra.length > 0 || object.name !== "object")
    throw new Error("<child> must hold exactly one <object>");
  return emitObject(object, depth);
}

/**
 * The Blueprint source for one rendered GtkBuilder document.
 *
 * Compiling the result with `@gjsify/blueprint` has to reproduce the input
 * XML — that equivalence is what `check.js` asserts, and it is the reason this
 * converter may be as narrow as it is.
 */
export function uiToBlueprint(ui: string): string {
  const root = parseUi(ui);
  if (root.name !== "interface") throw new Error(`root element is <${root.name}>, expected <interface>`);

  const lines: string[] = [];
  let template: UiElement | undefined;

  for (const child of root.children) {
    if (child.name === "requires") {
      const lib = child.attributes.get("lib");
      const version = child.attributes.get("version");
      const namespace = lib === undefined ? undefined : REQUIRES[lib];
      if (!namespace || !version) throw new Error(`unsupported <requires lib="${lib}" version="${version}">`);
      lines.push(`using ${namespace} ${version};`);
    } else if (child.name === "template") {
      if (template) throw new Error("more than one <template>");
      template = child;
    } else {
      throw new Error(`unsupported child of <interface>: <${child.name}>`);
    }
  }

  if (!template) throw new Error("no <template> — the renderer produced no view");
  lines.push("", ...emitObject(template, 0));
  return `${lines.join("\n")}\n`;
}

/** Non-overlapping occurrences of `needle` in `text`. */
function occurrences(text: string, needle: string): number {
  let found = 0;
  for (let at = text.indexOf(needle); at !== -1; at = text.indexOf(needle, at + needle.length)) found++;
  return found;
}

/** The first structural difference between two documents, if there is one. */
function firstDifference(expected: UiElement, actual: UiElement, where: string): string | null {
  if (expected.name !== actual.name) return `${where}: <${actual.name}> where <${expected.name}> was expected`;

  // `comments=` is the one attribute allowed to differ: it is a GtkBuilder
  // attribute blueprint does not carry into its output, because `emitProperty`
  // turns it into a `//` line instead. Rule 5 of `check.js` is what keeps
  // watch over that half.
  for (const [name, value] of expected.attributes) {
    if (name === "comments") continue;
    const found = actual.attributes.get(name);
    if (found !== value) return `${where}: ${name}="${clip(found ?? "")}", expected ${name}="${clip(value)}"`;
  }
  for (const name of actual.attributes.keys())
    if (name !== "comments" && !expected.attributes.has(name)) return `${where}: unexpected ${name} attribute`;

  if (unescapeXml(expected.text) !== unescapeXml(actual.text))
    return `${where}: text is ${clip(unescapeXml(actual.text))}, expected ${clip(unescapeXml(expected.text))}`;
  if (expected.children.length !== actual.children.length)
    return `${where}: ${actual.children.length} child element(s), expected ${expected.children.length}`;

  for (const [index, child] of expected.children.entries()) {
    const difference = firstDifference(child, actual.children[index]!, `${where}/${child.name}[${index}]`);
    if (difference) return difference;
  }
  return null;
}

/**
 * Asserts that `blueprint` compiles back to the GtkBuilder XML it came from.
 *
 * This is the independent witness the cross-target comparison in `check.js`
 * used to be. The three platforms now read one artifact, so nothing downstream
 * can notice a paragraph the conversion lost: both the `.blp` and the XML
 * compiled from it are the converter's own output, and a rule that compares
 * them cannot see what never left the renderer. The rendered XML is the only
 * value that is independent of the converter, and it exists for exactly as
 * long as this build run — which is why the check lives here rather than in
 * `check.js`.
 */
export function assertBlueprintMatchesUi(ui: string, blueprint: string, path: string): void {
  const compiled = emitGtkBuilderXml(parseBlueprint(blueprint, { path }));

  // Counted by substring on purpose. The trees compared below are both read
  // with the same reader the conversion used, so a reader that stopped
  // recognising an element would drop it from both sides and the comparison
  // would still pass. These numbers do not go through the reader at all.
  const tallies: Array<[string, number, number]> = [
    ["translatable strings in the blueprint", occurrences(ui, 'translatable="yes"'), occurrences(blueprint, ": _(")],
    [
      "translatable strings after compiling",
      occurrences(ui, 'translatable="yes"'),
      occurrences(compiled, 'translatable="yes"'),
    ],
    ["objects", occurrences(ui, "<object "), occurrences(compiled, "<object ")],
    ["properties", occurrences(ui, "<property "), occurrences(compiled, "<property ")],
    ["style classes", occurrences(ui, "<class "), occurrences(compiled, "<class ")],
  ];
  for (const [what, expected, actual] of tallies)
    if (expected !== actual) throw new Error(`${path}: ${actual} ${what}, expected ${expected}`);

  const difference = firstDifference(parseUi(ui), parseUi(compiled), "/interface");
  if (difference) throw new Error(`${path} does not compile back to the rendered XML — ${difference}`);
}
