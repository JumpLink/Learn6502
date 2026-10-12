import { existsSync } from "node:fs";
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { DOWNLOAD_LABELS, UI_SOURCE_LANGUAGE, languageCandidates, parseCatalog, quotePo, type Catalog, type SiteConfig } from "../site-data/index.ts";

const T_CALL = /\bt\(\s*"((?:[^"\\]|\\.)*)"\s*\)/g;

/** Every msgid the build can emit: translator calls, the download labels and the configured captions. */
export async function collectMsgids(buildDir: string, config: SiteConfig): Promise<string[]> {
  const msgids = new Set<string>();
  for (const file of (await readdir(buildDir)).sort()) {
    if (!file.endsWith(".ts") || file.endsWith(".test.ts")) continue;
    const source = await readFile(join(buildDir, file), "utf8");
    for (const match of source.matchAll(T_CALL)) msgids.add(JSON.parse(`"${match[1]}"`) as string);
  }
  for (const label of Object.values(DOWNLOAD_LABELS)) msgids.add(label);
  for (const item of config.screenshots.items) if (item.caption) msgids.add(item.caption);
  for (const download of config.downloads) if (download.label) msgids.add(download.label);
  return [...msgids];
}

const HEADER = (language: string | undefined) =>
  [
    'msgid ""',
    'msgstr ""',
    '"Project-Id-Version: learn6502-website\\n"',
    ...(language ? [`"Language: ${language}\\n"`] : []),
    '"MIME-Version: 1.0\\n"',
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
  ].join("\n");

/** Writes a catalogue: the translations in `known` are kept, everything else is left empty. */
export function renderPo(msgids: readonly string[], language: string | undefined, known: Catalog = new Map()): string {
  const entries = msgids.map((msgid) => `msgid ${quotePo(msgid)}\nmsgstr ${quotePo(known.get(msgid) ?? "")}`);
  return `${[HEADER(language), ...entries].join("\n\n")}\n`;
}

export function poPath(poDir: string, language: string): string {
  const existing = languageCandidates(language)
    .map((candidate) => join(poDir, `${candidate}.po`))
    .find((file) => existsSync(file));
  return existing ?? join(poDir, `${language.replace(/-/g, "_")}.po`);
}

export interface I18nResult {
  /** Files whose content differs from what the build would write (written unless `check`). */
  stale: string[];
  /** Languages with msgids that still lack a translation. */
  untranslated: string[];
}

/** Regenerates `website.pot` and the `<lang>.po` files, or with `check` only reports what would change. */
export async function syncCatalogs(poDir: string, config: SiteConfig, msgids: readonly string[], check: boolean): Promise<I18nResult> {
  const stale: string[] = [];
  const untranslated: string[] = [];
  const write = async (file: string, content: string, label: string) => {
    const current = existsSync(file) ? await readFile(file, "utf8") : "";
    if (current === content) return;
    stale.push(label);
    if (!check) await writeFile(file, content);
  };

  await write(join(poDir, "website.pot"), renderPo(msgids, undefined), "po/website.pot");
  for (const language of config.languages) {
    if (language === UI_SOURCE_LANGUAGE) continue;
    const file = poPath(poDir, language);
    const known = existsSync(file) ? parseCatalog(await readFile(file, "utf8")) : new Map<string, string>();
    await write(file, renderPo(msgids, language, known), `po/${language}.po`);
    const missing = msgids.filter((msgid) => !known.get(msgid));
    if (missing.length > 0) untranslated.push(`po/${language}.po has ${missing.length} untranslated string(s), e.g. "${missing[0]}"`);
  }
  return { stale, untranslated };
}
