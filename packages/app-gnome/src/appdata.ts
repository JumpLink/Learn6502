/**
 * The handful of AppStream fields the About dialog needs, extracted without a
 * dependency. Deliberately not a general AppStream parser — upstream's
 * `Adw.AboutDialog.new_from_appdata()` is that, and re-implementing it here
 * would be a second thing to keep correct. This covers only what the fallback
 * in `about-dialog.ts` shows when that constructor is unavailable.
 *
 * No GI imports: this module is plain TypeScript so `build-aux` can run it
 * under node and hold it against the real metainfo file.
 */
export interface AppdataFields {
  applicationName: string | null;
  developerName: string | null;
  website: string | null;
  issueUrl: string | null;
  supportUrl: string | null;
  license: string | null;
}

/** Everything outside `<developer>`, whose own `<name>` is a different field. */
const withoutDeveloper = (xml: string): string => xml.replace(/<developer[^>]*>[\s\S]*?<\/developer>/g, "");

/**
 * A translatable element, resolved against the caller's language preferences.
 *
 * The upstream constructor is localised — it shows "Lerne 6502 Assembler" in a
 * German session — so a fallback that always took the untranslated element
 * would quietly ship an English name to every non-English user on exactly the
 * platforms where the fallback runs.
 *
 * `languages` is `GLib.get_language_names()` order: most specific first, with
 * "C" standing for the untranslated source string.
 */
const translatable = (xml: string, tag: string, languages: readonly string[]): string | null => {
  const byLang = new Map<string, string>();
  let untranslated: string | null = null;

  for (const match of xml.matchAll(new RegExp(`<${tag}([^>]*)>([^<]*)</${tag}>`, "g"))) {
    const value = match[2].trim();
    if (!value) continue;
    const lang = /\bxml:lang\s*=\s*"([^"]*)"/.exec(match[1]);
    if (lang) {
      if (!byLang.has(lang[1])) byLang.set(lang[1], value);
    } else if (untranslated === null) {
      untranslated = value;
    }
  }

  for (const language of languages) {
    // "de_DE.UTF-8" → "de_DE" → "de": AppStream tags carry no encoding, and a
    // catalogue often has only the bare language.
    const base = language.split(".")[0];
    const candidate = byLang.get(base) ?? byLang.get(base.replace("_", "-"));
    if (candidate) return candidate;
    if (base === "C" || base === "POSIX") break;
  }
  return untranslated;
};

const url = (xml: string, type: string): string | null => {
  const match = new RegExp(`<url type="${type}">([^<]*)</url>`).exec(xml);
  return match ? match[1].trim() || null : null;
};

const field = (xml: string, tag: string): string | null => {
  const match = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml);
  return match ? match[1].trim() || null : null;
};

/**
 * The `<name>` inside `<developer>`, not the application's own `<name>`.
 *
 * It cannot go through `field()`: it carries `translate="no"`, so it has to be
 * matched *with* attributes. But matching attributes would also accept an
 * `xml:lang` translation, which would ship one locale's spelling to everyone —
 * so translated elements are skipped explicitly rather than by accident.
 */
const developerName = (xml: string): string | null => {
  const block = /<developer[^>]*>([\s\S]*?)<\/developer>/.exec(xml);
  if (!block) return null;
  for (const match of block[1].matchAll(/<name([^>]*)>([^<]*)<\/name>/g)) {
    if (/\bxml:lang\s*=/.test(match[1])) continue;
    const value = match[2].trim();
    if (value) return value;
  }
  return null;
};

export const parseAppdata = (xml: string, languages: readonly string[] = ["C"]): AppdataFields => ({
  applicationName: translatable(withoutDeveloper(xml), "name", languages),
  developerName: developerName(xml),
  website: url(xml, "homepage"),
  issueUrl: url(xml, "bugtracker"),
  supportUrl: url(xml, "help"),
  license: field(xml, "project_license"),
});
