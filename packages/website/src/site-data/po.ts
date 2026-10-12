import type { Localized } from "./types.ts";

/** A parsed gettext catalogue: msgid → msgstr, context-free, untranslated and fuzzy entries dropped. */
export type Catalog = ReadonlyMap<string, string>;

export interface PoEntry {
  msgctxt?: string;
  msgid: string;
  msgstr: string;
  fuzzy: boolean;
  references: string[];
}

const ESCAPES: Record<string, string> = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\" };

function unquote(raw: string): string {
  const body = raw.trim().slice(1, -1);
  return body.replace(/\\(.)/g, (_match, char: string) => ESCAPES[char] ?? char);
}

/** Parses a `.po`/`.pot` file; plural forms are not needed for web copy and are skipped. */
export function parsePo(text: string): PoEntry[] {
  const entries: PoEntry[] = [];
  let current: Partial<PoEntry> & { field?: "msgctxt" | "msgid" | "msgstr" | "skip" } = {};
  let flags = "";
  let references: string[] = [];

  const flush = () => {
    if (current.msgid !== undefined && current.msgstr !== undefined) {
      entries.push({
        msgctxt: current.msgctxt,
        msgid: current.msgid,
        msgstr: current.msgstr,
        fuzzy: /\bfuzzy\b/.test(flags),
        references,
      });
    }
    current = {};
    flags = "";
    references = [];
  };

  for (const line of text.split(/\r?\n/)) {
    if (line.startsWith("#,")) {
      flags += ` ${line.slice(2)}`;
    } else if (line.startsWith("#:")) {
      references.push(...line.slice(2).trim().split(/\s+/));
    } else if (line.startsWith("#") || line.trim() === "") {
      if (line.trim() === "" && current.msgid !== undefined) flush();
    } else if (line.startsWith("msgctxt ")) {
      if (current.msgid !== undefined) flush();
      current.msgctxt = unquote(line.slice(8));
      current.field = "msgctxt";
    } else if (line.startsWith("msgid_plural ")) {
      current.field = "skip";
    } else if (line.startsWith("msgid ")) {
      if (current.msgid !== undefined) flush();
      current.msgid = unquote(line.slice(6));
      current.field = "msgid";
    } else if (/^msgstr(\[0\])? /.test(line)) {
      current.msgstr = unquote(line.slice(line.indexOf(" ") + 1));
      current.field = "msgstr";
    } else if (/^msgstr\[\d+\] /.test(line)) {
      current.field = "skip";
    } else if (line.startsWith('"') && current.field && current.field !== "skip") {
      current[current.field] = (current[current.field] ?? "") + unquote(line);
    }
  }
  flush();
  return entries;
}

/** Builds a lookup from parsed entries, skipping the header, empty, fuzzy and context-bound entries. */
export function catalogFromEntries(entries: readonly PoEntry[]): Catalog {
  const catalog = new Map<string, string>();
  for (const entry of entries) {
    if (entry.msgid === "" || entry.msgstr === "" || entry.fuzzy || entry.msgctxt !== undefined) continue;
    catalog.set(entry.msgid, entry.msgstr);
  }
  return catalog;
}

export function parseCatalog(text: string): Catalog {
  return catalogFromEntries(parsePo(text));
}

/** Escapes a string for a `.po` file value. */
export function quotePo(value: string): string {
  return `"${value.replace(/[\\"\n\t\r]/g, (char) => (char === "\n" ? "\\n" : char === "\t" ? "\\t" : char === "\r" ? "\\r" : `\\${char}`))}"`;
}

/**
 * Language tags the metainfo (`pt-BR`, BCP 47) and gettext (`pt_BR`) spell differently, from most to
 * least specific: `pt-BR`, `pt_BR`, `pt`.
 */
export function languageCandidates(language: string): string[] {
  const dashed = language.replace(/_/g, "-");
  const candidates = [dashed, dashed.replace(/-/g, "_")];
  const base = dashed.split("-")[0];
  if (base && base !== dashed) candidates.push(base);
  return [...new Set(candidates)];
}

/** Finds the entry for a language in a map keyed by either spelling. */
export function pickByLanguage<T>(byLanguage: Readonly<Record<string, T>>, language: string): T | undefined {
  for (const candidate of languageCandidates(language)) {
    if (candidate in byLanguage) return byLanguage[candidate];
  }
  return undefined;
}

/**
 * Resolves a text for a language. Precedence: the metainfo's own `xml:lang` translation, then the
 * app catalogue (msgid = the source text), then the source text itself.
 */
export function resolveLocalized(text: Localized, language: string, catalog?: Catalog): string {
  const fromMetainfo = pickByLanguage(text.byLanguage, language);
  if (fromMetainfo !== undefined) return fromMetainfo;
  const fromCatalog = catalog?.get(text.source);
  return fromCatalog ?? text.source;
}

/** A translator bound to one catalogue; unknown msgids come back unchanged, which is gettext's contract. */
export function translator(catalog: Catalog | undefined): (msgid: string) => string {
  return (msgid) => catalog?.get(msgid) ?? msgid;
}

/**
 * Fills in the translations a text lacks for the site's languages, from the app catalogues
 * (keyed by language). Translations the metainfo already carries win; other metainfo languages are dropped.
 */
export function completeLocalized(
  text: Localized,
  languages: readonly string[],
  defaultLanguage: string,
  catalogs: Readonly<Record<string, Catalog>>
): Localized {
  const byLanguage: Record<string, string> = {};
  for (const language of languages) {
    if (language === defaultLanguage) continue;
    const fromMetainfo = pickByLanguage(text.byLanguage, language);
    const fromCatalog = catalogs[language]?.get(text.source);
    const resolved = fromMetainfo ?? fromCatalog;
    if (resolved !== undefined) byLanguage[language] = resolved;
  }
  return { source: text.source, byLanguage };
}
