import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseSiteConfig, type RootManifest } from "./config.ts";
import { buildDownloadTargets } from "./downloads.ts";
import { fetchFlathubStats } from "./flathub.ts";
import { fetchLatestRelease } from "./github.ts";
import { parseMetainfo } from "./metainfo.ts";
import type { NetworkOptions } from "./network.ts";
import { minimumAge } from "./oars.ts";
import { completeLocalized, languageCandidates, parseCatalog, type Catalog } from "./po.ts";
import { buildScreenshots } from "./screenshots.ts";
import type { DescriptionBlock, LatestRelease, Localized, Release, SiteData, Stats } from "./types.ts";

export interface LoadOptions {
  /** Repository root: where the root package.json lives and the config's paths start. */
  root: string;
  /** Website catalogues by language, used to translate screenshot captions configured in `gjsify.site`. */
  uiCatalogs?: Readonly<Record<string, Catalog>>;
  /** Skip every network call (release assets and stats). */
  offline?: boolean;
  githubToken?: string;
  network?: NetworkOptions;
  warn?: (message: string) => void;
}

/** Reads `<dir>/<lang>.po` for every language, trying `pt-BR` and `pt_BR` spellings; missing files are skipped. */
export async function loadCatalogs(dir: string, languages: readonly string[]): Promise<Record<string, Catalog>> {
  const catalogs: Record<string, Catalog> = {};
  for (const language of languages) {
    for (const candidate of languageCandidates(language)) {
      const file = join(dir, `${candidate}.po`);
      if (existsSync(file)) {
        catalogs[language] = parseCatalog(await readFile(file, "utf8"));
        break;
      }
    }
  }
  return catalogs;
}

/** Collects everything the pages need into one object. Network failures degrade to warnings. */
export async function loadSiteData(options: LoadOptions): Promise<SiteData> {
  const warnings: string[] = [];
  const warn = (message: string) => {
    warnings.push(message);
    options.warn?.(message);
  };

  const manifest = JSON.parse(await readFile(join(options.root, "package.json"), "utf8")) as RootManifest;
  const config = parseSiteConfig(manifest);
  const version = manifest.version ?? "";

  const metainfoPath = resolve(options.root, config.metainfo);
  if (!existsSync(metainfoPath))
    throw new Error(`gjsify.site.metainfo points to "${config.metainfo}", which does not exist`);
  const metainfo = parseMetainfo(await readFile(metainfoPath, "utf8"));

  const appCatalogs = config.translations
    ? await loadCatalogs(resolve(options.root, config.translations), config.languages)
    : {};
  const complete = (text: Localized) => completeLocalized(text, config.languages, config.defaultLanguage, appCatalogs);
  const completeBlocks = (blocks: DescriptionBlock[]): DescriptionBlock[] =>
    blocks.map((block) =>
      block.type === "paragraph"
        ? { type: "paragraph", text: complete(block.text) }
        : { type: "list", items: block.items.map(complete) }
    );

  const captionFor = (msgid: string): Localized => {
    const byLanguage: Record<string, string> = {};
    for (const language of config.languages) {
      const translated = options.uiCatalogs?.[language]?.get(msgid);
      if (translated !== undefined && language !== config.defaultLanguage) byLanguage[language] = translated;
    }
    return { source: msgid, byLanguage };
  };

  const screenshots = buildScreenshots(config, metainfo, options.root, captionFor).map((screenshot) => ({
    ...screenshot,
    caption: screenshot.caption ? complete(screenshot.caption) : null,
  }));

  const icon = manifest.gjsify?.flatpak?.icon ?? manifest.gjsify?.ship?.icon;
  if (icon && !existsSync(resolve(options.root, icon))) throw new Error(`The app icon "${icon}" does not exist`);

  let latestRelease: LatestRelease | null = null;
  const stats: Stats = {};
  if (!options.offline) {
    const network = options.network ?? {};
    const [release, flathub] = await Promise.allSettled([
      fetchLatestRelease(config.repository, options.githubToken, network),
      config.flathub ? fetchFlathubStats(config.flathub, network) : Promise.resolve(undefined),
    ]);
    if (release.status === "fulfilled") {
      latestRelease = release.value;
      stats.githubDownloads = latestRelease.assets.reduce((sum, asset) => sum + asset.downloadCount, 0);
    } else {
      warn(
        `Could not fetch the latest GitHub release (${String(release.reason)}); linking to the releases page instead`
      );
    }
    if (flathub.status === "fulfilled" && flathub.value) {
      stats.flathubInstalls = flathub.value.installsTotal;
      stats.flathubInstallsLastMonth = flathub.value.installsLastMonth;
    } else if (flathub.status === "rejected") {
      warn(`Could not fetch Flathub statistics (${String(flathub.reason)}); omitting install counts`);
    }
  }

  const age = metainfo.contentRating
    ? minimumAge(metainfo.contentRating.type, metainfo.contentRating.attributes)
    : undefined;
  const developer = metainfo.developer.name
    ? metainfo.developer
    : { id: manifest.gjsify?.flatpak?.developer?.id, name: manifest.gjsify?.flatpak?.developer?.name ?? "" };

  const releases: Release[] = metainfo.releases.map((release) => ({
    ...release,
    description: completeBlocks(release.description),
  }));

  return {
    config,
    version,
    app: {
      id: metainfo.id,
      name: complete(metainfo.name),
      summary: complete(metainfo.summary),
      developer,
      description: completeBlocks(metainfo.description),
      license: metainfo.projectLicense,
      contentLicense: metainfo.metadataLicense,
      keywords: metainfo.keywords.map(complete),
      categories: metainfo.categories,
      urls: metainfo.urls,
      branding: metainfo.branding,
      ageRating: age === undefined ? undefined : { minAge: age },
      icon,
    },
    screenshots,
    releases,
    latestRelease,
    downloads: {
      targets: buildDownloadTargets({
        assets: latestRelease?.assets ?? [],
        flathub: config.flathub,
        webAppUrl: config.webApp ? `${config.base}${config.webApp.replace(/^\//, "")}` : undefined,
      }),
      releasesUrl: `https://github.com/${config.repository}/releases`,
    },
    stats,
    warnings,
  };
}
