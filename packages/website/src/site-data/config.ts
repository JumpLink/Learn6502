import type {
  ScreenshotItemConfig,
  ScreenshotSource,
  ScreenshotVariants,
  SiteConfig,
  SiteLegalLink,
  SiteSupportLink,
} from "./types.ts";

/** The slice of the root package.json the site reads. Everything is optional until validated. */
export interface RootManifest {
  version?: string;
  gjsify?: {
    site?: unknown;
    ship?: { icon?: string };
    flatpak?: { appId?: string; icon?: string; developer?: { id?: string; name?: string } };
  };
}

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(raw: Raw, key: string): string {
  const value = raw[key];
  if (typeof value !== "string" || value === "")
    throw new Error(`gjsify.site.${key} is required and must be a non-empty string`);
  return value;
}

function optionalString(raw: Raw, key: string): string | undefined {
  const value = raw[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value === "") throw new Error(`gjsify.site.${key} must be a non-empty string`);
  return value;
}

function objectList(raw: Raw, key: string): Raw[] {
  const value = raw[key];
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every(isRecord)) throw new Error(`gjsify.site.${key} must be a list of objects`);
  return value;
}

function stringField(entry: Raw, key: string, where: string): string {
  const value = entry[key];
  if (typeof value !== "string" || value === "") throw new Error(`${where}.${key} must be a non-empty string`);
  return value;
}

const VARIANT_NAMES = ["desktop-light", "desktop-dark", "mobile-light", "mobile-dark"] as const;

function parseVariants(value: unknown, where: string): ScreenshotVariants {
  if (value === undefined) return {};
  if (!isRecord(value)) throw new Error(`${where}.variants must be an object`);
  const variants: ScreenshotVariants = {};
  for (const [key, path] of Object.entries(value)) {
    if (!(VARIANT_NAMES as readonly string[]).includes(key)) {
      throw new Error(`${where}.variants has unknown key "${key}"; use ${VARIANT_NAMES.join(", ")}`);
    }
    if (typeof path !== "string" || path === "") throw new Error(`${where}.variants.${key} must be a file path`);
    variants[key as (typeof VARIANT_NAMES)[number]] = path;
  }
  return variants;
}

function parseScreenshots(raw: unknown): SiteConfig["screenshots"] {
  if (raw === undefined) return { source: "metainfo", items: [] };
  if (!isRecord(raw)) throw new Error("gjsify.site.screenshots must be an object");
  const source = (raw.source ?? "metainfo") as ScreenshotSource;
  if (!["metainfo", "site", "merge"].includes(source)) {
    throw new Error(
      `gjsify.site.screenshots.source must be "metainfo", "site" or "merge", got "${String(raw.source)}"`
    );
  }
  const items: ScreenshotItemConfig[] = objectList(raw, "items").map((item, index) => {
    const where = `gjsify.site.screenshots.items[${index}]`;
    const from = item.from;
    if (from !== undefined && (typeof from !== "number" || !Number.isInteger(from) || from < 0)) {
      throw new Error(`${where}.from must be a non-negative integer`);
    }
    const caption = item.caption;
    if (caption !== undefined && typeof caption !== "string") throw new Error(`${where}.caption must be a string`);
    return { from, caption, variants: parseVariants(item.variants, where) };
  });
  return { source, items };
}

/** Root-relative directory URL: `/x/` with a leading and trailing slash. */
export function normalizeBase(base: string): string {
  return `/${base.replace(/^\/+|\/+$/g, "")}/`.replace(/^\/\/$/, "/");
}

/** Validates `gjsify.site` and applies defaults; the error names the offending key. */
export function parseSiteConfig(manifest: RootManifest): SiteConfig {
  const raw = manifest.gjsify?.site;
  if (!isRecord(raw)) throw new Error('The root package.json has no "gjsify.site" object');

  const languages = raw.languages ?? ["en"];
  if (!Array.isArray(languages) || languages.length === 0 || !languages.every((entry) => typeof entry === "string")) {
    throw new Error("gjsify.site.languages must be a non-empty list of language codes");
  }
  const defaultLanguage = optionalString(raw, "defaultLanguage") ?? (languages[0] as string);
  if (!languages.includes(defaultLanguage))
    throw new Error(`gjsify.site.defaultLanguage "${defaultLanguage}" is not in languages`);

  const url = requireString(raw, "url");

  return {
    metainfo: requireString(raw, "metainfo"),
    base: normalizeBase(requireString(raw, "base")),
    url: url.endsWith("/") ? url : `${url}/`,
    languages: languages as string[],
    defaultLanguage,
    repository: requireString(raw, "repository"),
    flathub: optionalString(raw, "flathub"),
    webApp: optionalString(raw, "webApp"),
    translations: optionalString(raw, "translations"),
    support: objectList(raw, "support").map(
      (entry, index): SiteSupportLink => ({
        kind: stringField(entry, "kind", `gjsify.site.support[${index}]`),
        url: stringField(entry, "url", `gjsify.site.support[${index}]`),
      })
    ),
    legal: objectList(raw, "legal").map(
      (entry, index): SiteLegalLink => ({
        label: stringField(entry, "label", `gjsify.site.legal[${index}]`),
        url: stringField(entry, "url", `gjsify.site.legal[${index}]`),
      })
    ),
    screenshots: parseScreenshots(raw.screenshots),
  };
}
