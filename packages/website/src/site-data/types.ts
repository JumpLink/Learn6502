/** Operating systems a download can target. `web` covers the browser build and a self-hosting archive. */
export type TargetOs = "linux" | "darwin" | "win32" | "web" | "android";

/** `noarch` means one file serves every architecture (Flatpak, `.deb` "all", the web build). */
export type TargetArch = "x86_64" | "arm64" | "noarch";

export type TargetFormat = "flathub" | "flatpak" | "appimage" | "deb" | "rpm" | "msi" | "zip" | "dmg" | "apk" | "web";

/** The four artwork variants a screenshot can ship; at least one is required. */
export type ScreenshotVariantKey = "desktop-light" | "desktop-dark" | "mobile-light" | "mobile-dark";

export type ScreenshotVariants = Partial<Record<ScreenshotVariantKey, string>>;

/**
 * Text with the untranslated source and any translations found in the metainfo. `source` is
 * written in the site's default language; `byLanguage` is keyed by BCP 47 tag as the metainfo
 * spells it (`de`, `pt-BR`).
 */
export interface Localized {
  source: string;
  byLanguage: Record<string, string>;
}

export type DescriptionBlock = { type: "paragraph"; text: Localized } | { type: "list"; items: Localized[] };

export interface SiteSupportLink {
  kind: string;
  url: string;
}

export interface SiteLegalLink {
  label: string;
  url: string;
}

export interface ScreenshotItemConfig {
  /** Index into the metainfo `<screenshots>` list, to reuse its caption and order. */
  from?: number;
  /** A msgid of the website catalogue. */
  caption?: string;
  variants?: ScreenshotVariants;
}

export type ScreenshotSource = "metainfo" | "site" | "merge";

/** The `gjsify.site` block of the root package.json, with defaults applied. */
export interface SiteConfig {
  metainfo: string;
  base: string;
  url: string;
  languages: string[];
  defaultLanguage: string;
  repository: string;
  flathub?: string;
  webApp?: string;
  /** Directory holding the app's `<lang>.po` catalogues, used when the metainfo lacks a translation. */
  translations?: string;
  support: SiteSupportLink[];
  legal: SiteLegalLink[];
  screenshots: { source: ScreenshotSource; items: ScreenshotItemConfig[] };
}

export interface Screenshot {
  caption: Localized | null;
  /** Repo-relative file paths, validated to exist. */
  variants: ScreenshotVariants;
}

export interface Release {
  version: string;
  date: string;
  type?: string;
  description: DescriptionBlock[];
}

export interface DownloadTarget {
  os: TargetOs;
  arch: TargetArch;
  format: TargetFormat;
  /** English label; the page translates it through the website catalogue. */
  label: string;
  url: string;
  size?: number;
  downloadCount?: number;
  /** The one target to offer first for its OS. */
  recommended: boolean;
}

export interface ReleaseAsset {
  name: string;
  size: number;
  downloadUrl: string;
  downloadCount: number;
}

export interface LatestRelease {
  tag: string;
  name: string;
  publishedAt: string;
  url: string;
  assets: ReleaseAsset[];
}

export interface AgeRating {
  /** Minimum age in years, derived from the OARS attributes the way libappstream does. */
  minAge: number;
}

export interface Branding {
  light?: string;
  dark?: string;
}

export interface AppUrls {
  homepage?: string;
  bugtracker?: string;
  vcsBrowser?: string;
  translate?: string;
  donation?: string;
  help?: string;
  faq?: string;
  contact?: string;
  contribute?: string;
}

/** What the AppStream metainfo says, before any site configuration is mixed in. */
export interface Metainfo {
  id: string;
  name: Localized;
  summary: Localized;
  developer: { id?: string; name: string };
  description: DescriptionBlock[];
  /** Metainfo screenshots in document order; `url` is the remote image, kept for reference. */
  screenshots: Array<{ url: string; caption: Localized | null }>;
  releases: Release[];
  branding: Branding;
  urls: AppUrls;
  keywords: Localized[];
  categories: string[];
  projectLicense?: string;
  /** Licence of the metainfo text itself, which is what the page reproduces. */
  metadataLicense?: string;
  contentRating?: { type: string; attributes: Record<string, string> };
}

export interface Stats {
  /** Total installs reported by Flathub. */
  flathubInstalls?: number;
  flathubInstallsLastMonth?: number;
  /** Sum of GitHub release asset downloads for the latest release. */
  githubDownloads?: number;
}

export interface SiteData {
  config: SiteConfig;
  version: string;
  app: {
    id: string;
    name: Localized;
    summary: Localized;
    developer: { id?: string; name: string };
    description: DescriptionBlock[];
    license?: string;
    /** Licence of the text this page reproduces, as opposed to the app's own. */
    contentLicense?: string;
    keywords: Localized[];
    categories: string[];
    urls: AppUrls;
    branding: Branding;
    ageRating?: AgeRating;
    /** Repo-relative path to the app icon. */
    icon?: string;
  };
  screenshots: Screenshot[];
  releases: Release[];
  latestRelease: LatestRelease | null;
  downloads: {
    targets: DownloadTarget[];
    /** Always present: the fallback when no asset list could be fetched. */
    releasesUrl: string;
  };
  stats: Stats;
  /** Non-fatal problems met while collecting data, already logged. */
  warnings: string[];
}
