import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import {
  loadCatalogs,
  loadSiteData,
  parseSiteConfig,
  translator,
  type RootManifest,
  type SiteData,
} from "./site-data/index.ts";
import { collectMsgids, syncCatalogs } from "./build/i18n.ts";
import { processImage, type ProcessedImage } from "./build/images.ts";
import { pictureVariants, renderPage, renderRoot, type ClientAssets } from "./build/pages.ts";

const packageDir = resolve(import.meta.dirname, "..");
const repoRoot = resolve(packageDir, "../..");
const poDir = join(packageDir, "po");
const distDir = join(packageDir, "dist");
const cacheDir = join(packageDir, ".cache");

const USAGE = `Usage: node src/cli.ts <command> [options]

  build [--offline] [--no-cache]  Render the static pages into dist/ (run \`vite build\` first)
  i18n [--check]                  Update po/website.pot and po/<lang>.po from the sources, or only verify them

Environment: GITHUB_TOKEN raises the GitHub API rate limit.`;

async function readConfig() {
  const manifest = JSON.parse(await readFile(join(repoRoot, "package.json"), "utf8")) as RootManifest;
  return parseSiteConfig(manifest);
}

async function i18n(check: boolean): Promise<number> {
  const config = await readConfig();
  const msgids = await collectMsgids(join(packageDir, "src/build"), config);
  const { stale, untranslated } = await syncCatalogs(poDir, config, msgids, check);
  for (const file of stale)
    console.log(check ? `${file} is out of date; run \`gjsify workspace @learn6502/website i18n\`` : `updated ${file}`);
  for (const message of untranslated) console.error(message);
  return untranslated.length > 0 || (check && stale.length > 0) ? 1 : 0;
}

async function readManifest(): Promise<ClientAssets> {
  const file = join(distDir, ".vite/manifest.json");
  if (!existsSync(file))
    throw new Error(
      "dist/.vite/manifest.json is missing; run `vite build` before `build` (the `build` script does both)"
    );
  const manifest = JSON.parse(await readFile(file, "utf8")) as Record<
    string,
    { file: string; css?: string[]; isEntry?: boolean }
  >;
  const entry = Object.values(manifest).find((candidate) => candidate.isEntry);
  if (!entry) throw new Error("The Vite manifest has no entry chunk");
  return { js: entry.file, css: entry.css ?? [] };
}

async function build(options: { offline: boolean; useCache: boolean }): Promise<void> {
  const config = await readConfig();
  const catalogs = await loadCatalogs(poDir, config.languages);
  const data = await loadSiteData({
    root: repoRoot,
    uiCatalogs: catalogs,
    offline: options.offline,
    githubToken: process.env.GITHUB_TOKEN || undefined,
    network: options.useCache ? { cacheDir: join(cacheDir, "http") } : {},
    warn: (message) => console.warn(`warning: ${message}`),
  });

  const base = data.config.base;
  const vite = await readManifest();
  const assets: ClientAssets = { js: `${base}${vite.js}`, css: vite.css.map((file) => `${base}${file}`) };

  const images = await processScreenshots(data);
  const iconUrl = await publishIcon(data);

  for (const lang of data.config.languages) {
    const html = renderPage({ data, lang, t: translator(catalogs[lang]), assets, images, iconUrl });
    await mkdir(join(distDir, lang), { recursive: true });
    await writeFile(join(distDir, lang, "index.html"), html);
  }
  await writeFile(join(distDir, "index.html"), renderRoot(data, assets, iconUrl));
  console.log(`Built ${data.config.languages.length} pages and ${images.size} screenshots into ${distDir}`);
}

async function processScreenshots(data: SiteData): Promise<Map<string, ProcessedImage>> {
  const paths = new Set(
    data.screenshots.flatMap((screenshot) => pictureVariants(screenshot).map((variant) => variant.path))
  );
  const options = {
    outDir: join(distDir, "img"),
    cacheDir: join(cacheDir, "images"),
    urlBase: `${data.config.base}img/`,
  };
  const entries = await Promise.all(
    [...paths].map(async (path) => [path, await processImage(resolve(repoRoot, path), path, options)] as const)
  );
  return new Map(entries);
}

async function publishIcon(data: SiteData): Promise<string | undefined> {
  if (!data.app.icon) return undefined;
  const name = basename(data.app.icon);
  await copyFile(resolve(repoRoot, data.app.icon), join(distDir, name));
  return `${data.config.base}${name}`;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...flags] = argv;
  if (command === "build") {
    await build({ offline: flags.includes("--offline"), useCache: !flags.includes("--no-cache") });
    return 0;
  }
  if (command === "i18n") return i18n(flags.includes("--check"));
  console.error(USAGE);
  return command === "--help" || command === "-h" ? 0 : 2;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
);
