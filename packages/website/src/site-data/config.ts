import type {
  ScreenshotItemConfig,
  ScreenshotSource,
  ScreenshotVariants,
  TargetFormat,
  TargetPlatform,
  SiteConfig,
  SiteDownloadConfig,
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

const PLATFORMS: readonly TargetPlatform[] = ["linux", "darwin", "win32", "android", "web", "firefox", "chromium"];
const FORMATS: readonly TargetFormat[] = [
  "flathub",
  "flatpak",
  "appimage",
  "deb",
  "rpm",
  "msi",
  "zip",
  "dmg",
  "apk",
  "web",
  "store",
  "xpi",
  "source",
];

function parseDownloads(raw: Raw): SiteDownloadConfig[] {
  return objectList(raw, "downloads").map((entry, index) => {
    const where = `gjsify.site.downloads[${index}]`;
    const platform = stringField(entry, "platform", where) as TargetPlatform;
    if (!PLATFORMS.includes(platform)) throw new Error(`${where}.platform must be one of ${PLATFORMS.join(", ")}`);
    const format = stringField(entry, "format", where) as TargetFormat;
    if (!FORMATS.includes(format)) throw new Error(`${where}.format must be one of ${FORMATS.join(", ")}`);
    const available = entry.available ?? true;
    if (typeof available !== "boolean") throw new Error(`${where}.available must be true or false`);
    const url = entry.url;
    if (available && (typeof url !== "string" || !/^https?:\/\//.test(url))) {
      throw new Error(`${where}.url must be an http(s) address unless "available" is false`);
    }
    if (url !== undefined && (typeof url !== "string" || !/^https?:\/\//.test(url))) {
      throw new Error(`${where}.url must be an http(s) address`);
    }
    const label = entry.label;
    if (label !== undefined && (typeof label !== "string" || label === ""))
      throw new Error(`${where}.label must be a non-empty string`);
    return { platform, format, url, label, available };
  });
}

function parseReleaseAssets(raw: Raw): boolean {
  const value = raw.releaseAssets ?? true;
  if (typeof value !== "boolean") throw new Error("gjsify.site.releaseAssets must be true or false");
  return value;
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
    sourceLanguage: optionalString(raw, "sourceLanguage") ?? "en",
    repository: requireString(raw, "repository"),
    flathub: optionalString(raw, "flathub"),
    webApp: optionalString(raw, "webApp"),
    translations: optionalString(raw, "translations"),
    icon: optionalString(raw, "icon"),
    downloads: parseDownloads(raw),
    releaseAssets: parseReleaseAssets(raw),
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
