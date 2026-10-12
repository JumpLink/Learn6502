import { pickByLanguage, resolveVariant, type DescriptionBlock, type DownloadTarget, type Localized, type Screenshot, type ScreenshotVariantKey, type SiteData, type TargetOs } from "../site-data/index.ts";
import { attrs, esc, fmt, plain } from "./html.ts";
import type { ImageFormat, ProcessedImage } from "./images.ts";

export interface ClientAssets {
  js: string;
  css: string[];
}

export interface RenderContext {
  data: SiteData;
  lang: string;
  t: (msgid: string) => string;
  assets: ClientAssets;
  /** Processed renditions keyed by the repo-relative path of the source file. */
  images: ReadonlyMap<string, ProcessedImage>;
  /** Published URL of the app icon, when there is one. */
  iconUrl?: string;
}

const MOBILE = "(max-width: 600px)";
const DARK = "(prefers-color-scheme: dark)";
const FORMAT_TYPES: Record<ImageFormat, string> = { avif: "image/avif", webp: "image/webp", png: "image/png" };
const SIZES = "(max-width: 600px) 90vw, 720px";

const LINKS: Array<[key: "homepage" | "help" | "faq" | "vcsBrowser" | "bugtracker" | "contribute" | "translate" | "contact" | "donation", label: (t: (m: string) => string) => string]> = [
  ["homepage", (t) => t("Website")],
  ["help", (t) => t("Help")],
  ["faq", (t) => t("FAQ")],
  ["vcsBrowser", (t) => t("Source code")],
  ["bugtracker", (t) => t("Report an issue")],
  ["contribute", (t) => t("Contribute")],
  ["translate", (t) => t("Help translate")],
  ["contact", (t) => t("Contact")],
  ["donation", (t) => t("Donate")],
];

export function localized(text: Localized, lang: string): string {
  return pickByLanguage(text.byLanguage, lang) ?? text.source;
}

export function pageUrl(data: SiteData, lang: string): string {
  return `${data.config.base}${lang}/`;
}

function absolute(data: SiteData, rootRelative: string): string {
  return new URL(rootRelative.replace(/^\//, ""), `${new URL(data.config.url).origin}/`).href;
}

function languageName(code: string): string {
  return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
}

function blocks(content: DescriptionBlock[], lang: string): string {
  return content
    .map((block) =>
      block.type === "paragraph"
        ? `<p>${esc(localized(block.text, lang))}</p>`
        : `<ul>${block.items.map((item) => `<li>${esc(localized(item, lang))}</li>`).join("")}</ul>`
    )
    .join("\n");
}

function osName(os: TargetOs, t: (m: string) => string): string {
  return { linux: t("Linux"), darwin: t("macOS"), win32: t("Windows"), android: t("Android"), web: t("Web") }[os];
}

function sizeLabel(bytes: number | undefined, lang: string): string {
  if (!bytes) return "";
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

/** The variant files a screenshot needs, deduplicated: the `<picture>` only carries `<source>`s that differ. */
export function pictureVariants(screenshot: Screenshot): Array<{ media?: string; path: string; key: ScreenshotVariantKey }> {
  const path = (key: ScreenshotVariantKey) => resolveVariant(screenshot.variants, key) as string;
  const fallback = path("desktop-light");
  const sources: Array<{ media?: string; path: string; key: ScreenshotVariantKey }> = [];
  if (path("mobile-dark") !== path("mobile-light")) sources.push({ media: `${MOBILE} and ${DARK}`, path: path("mobile-dark"), key: "mobile-dark" });
  if (path("mobile-light") !== fallback || path("mobile-light") !== path("desktop-dark")) {
    sources.push({ media: MOBILE, path: path("mobile-light"), key: "mobile-light" });
  }
  if (path("desktop-dark") !== fallback) sources.push({ media: DARK, path: path("desktop-dark"), key: "desktop-dark" });
  sources.push({ path: fallback, key: "desktop-light" });
  return sources;
}

function srcset(files: Array<{ url: string; width: number }>): string {
  return files.map((file) => `${file.url} ${file.width}w`).join(", ");
}

function picture(ctx: RenderContext, screenshot: Screenshot, alt: string, eager: boolean): string {
  const variants = pictureVariants(screenshot);
  const fallback = variants[variants.length - 1]!;
  const sources = variants.slice(0, -1).flatMap((variant) => {
    const image = ctx.images.get(variant.path)!;
    return (["avif", "webp", "png"] as const).map(
      (format) =>
        `<source${attrs({ media: variant.media, type: FORMAT_TYPES[format], srcset: srcset(image.formats[format]), sizes: SIZES, width: image.width, height: image.height })}>`
    );
  });
  const base = ctx.images.get(fallback.path)!;
  const formats = (["avif", "webp"] as const).map(
    (format) => `<source${attrs({ type: FORMAT_TYPES[format], srcset: srcset(base.formats[format]), sizes: SIZES, width: base.width, height: base.height })}>`
  );
  const png = base.formats.png;
  const img = `<img${attrs({
    src: png[png.length - 1]!.url,
    srcset: srcset(png),
    sizes: SIZES,
    width: base.width,
    height: base.height,
    alt,
    loading: eager ? undefined : "lazy",
    decoding: "async",
  })}>`;
  return `<picture>${[...sources, ...formats, img].join("")}</picture>`;
}

function screenshotBand(ctx: RenderContext): string {
  if (ctx.data.screenshots.length === 0) return "";
  const { t, lang } = ctx;
  const slides = ctx.data.screenshots.map((screenshot, index) => {
    const caption = screenshot.caption ? localized(screenshot.caption, lang) : "";
    const alt = caption || plain(t("Screenshot {number}"), { number: index + 1 });
    return `<li><figure>${picture(ctx, screenshot, alt, index === 0)}${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure></li>`;
  });
  return `<section class="screenshots" aria-label="${esc(t("Screenshots"))}">
<screenshot-carousel><ul>${slides.join("\n")}</ul></screenshot-carousel>
</section>`;
}

function targetItem(target: DownloadTarget, ctx: RenderContext): string {
  const meta = [target.arch === "noarch" ? "" : target.arch, sizeLabel(target.size, ctx.lang)].filter(Boolean).join(" · ");
  return `<li${attrs({ "data-os": target.os, "data-recommended": target.recommended })}><a href="${esc(target.url)}">${esc(ctx.t(target.label))}</a>${meta ? ` <small>${esc(meta)}</small>` : ""}</li>`;
}

function downloadButton(ctx: RenderContext): string {
  const { data, t } = ctx;
  const targets = data.downloads.targets;
  const primary = targets.find((target) => target.recommended && target.os === "linux") ?? targets[0];
  const label = primary ? fmt(t("Get it: {format}"), { format: t(primary.label) }) : esc(t("All releases"));
  const href = primary?.url ?? data.downloads.releasesUrl;
  return `<app-download class="download">
<div class="split">
<a class="button" href="${esc(href)}">${label}</a>
<details class="more"><summary aria-label="${esc(t("More download options"))}"></summary>
<ul>${targets.map((target) => targetItem(target, ctx)).join("\n")}
<li><a href="${esc(data.downloads.releasesUrl)}">${esc(t("All releases"))}</a></li></ul>
</details>
</div>
</app-download>`;
}

function badges(ctx: RenderContext): string {
  const { data, t, lang } = ctx;
  const number = new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 });
  const items: Array<[value: string, label: string]> = [];
  if (data.stats.flathubInstalls !== undefined) items.push([number.format(data.stats.flathubInstalls), t("installs on Flathub")]);
  if (data.stats.githubDownloads) items.push([number.format(data.stats.githubDownloads), t("downloads on GitHub")]);
  if (data.app.ageRating) items.push([plain(t("{age}+"), { age: data.app.ageRating.minAge }), t("age rating")]);
  if (data.app.license) items.push([data.app.license, t("license")]);
  if (items.length === 0) return "";
  return `<ul class="badges">${items.map(([value, label]) => `<li><strong>${esc(value)}</strong><span>${esc(label)}</span></li>`).join("")}</ul>`;
}

function releaseDate(date: string, lang: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(parsed);
}

function releases(ctx: RenderContext): string {
  const [latest, ...older] = ctx.data.releases;
  if (!latest) return "";
  const { t, lang } = ctx;
  const article = (release: typeof latest, heading: string) =>
    `<article><${heading}>${fmt(t("Changes in version {version}"), { version: release.version })}</${heading}>
<p><time datetime="${esc(release.date)}">${esc(releaseDate(release.date, lang))}</time></p>
${blocks(release.description, lang)}</article>`;
  return `<section class="releases">
<details class="card" open><summary>${fmt(t("Changes in version {version}"), { version: latest.version })}</summary>
<p><time datetime="${esc(latest.date)}">${esc(releaseDate(latest.date, lang))}</time></p>
${blocks(latest.description, lang)}
</details>
${older.length > 0 ? `<details class="older"><summary>${esc(t("Older releases"))}</summary>\n${older.map((release) => article(release, "h3")).join("\n")}</details>` : ""}
</section>`;
}

function links(ctx: RenderContext): string {
  const { data, t } = ctx;
  const items = LINKS.flatMap(([key, label]) => (data.app.urls[key] ? [`<li><a href="${esc(data.app.urls[key])}">${esc(label(t))}</a></li>`] : []));
  for (const support of data.config.support) items.push(`<li><a href="${esc(support.url)}">${esc(t(support.kind))}</a></li>`);
  return items.length === 0 ? "" : `<section class="links"><h2>${esc(t("Links"))}</h2><ul>${items.join("")}</ul></section>`;
}

function tags(ctx: RenderContext): string {
  const { data, t, lang } = ctx;
  const keywords = data.app.keywords.map((keyword) => localized(keyword, lang));
  const arches = [...new Set(data.downloads.targets.map((target) => target.arch).filter((arch) => arch !== "noarch"))];
  const list = (label: string, values: string[]) =>
    values.length === 0 ? "" : `<div><h3>${esc(label)}</h3><ul class="tags">${values.map((value) => `<li>${esc(value)}</li>`).join("")}</ul></div>`;
  const body = [list(t("Categories"), data.app.categories), list(t("Keywords"), keywords), list(t("Architectures"), arches)].join("");
  return body ? `<section class="tags-section">${body}</section>` : "";
}

function downloadList(ctx: RenderContext): string {
  const { data, t } = ctx;
  const groups = new Map<TargetOs, DownloadTarget[]>();
  for (const target of data.downloads.targets) groups.set(target.os, [...(groups.get(target.os) ?? []), target]);
  const body = [...groups].map(([os, targets]) => `<h3>${esc(osName(os, t))}</h3><ul>${targets.map((target) => targetItem(target, ctx)).join("\n")}</ul>`).join("\n");
  return `<section id="downloads" class="downloads"><h2>${esc(t("Downloads"))}</h2>
${body}
<p><a href="${esc(data.downloads.releasesUrl)}">${esc(t("All releases on GitHub"))}</a></p></section>`;
}

function head(ctx: RenderContext): string {
  const { data, lang, t } = ctx;
  const name = localized(data.app.name, lang);
  const summary = localized(data.app.summary, lang);
  const title = `${name} – ${summary}`;
  const url = absolute(data, pageUrl(data, lang));
  const first = data.screenshots[0];
  const og = first ? ctx.images.get(pictureVariants(first).at(-1)!.path) : undefined;
  const ogImage = og ? absolute(data, og.formats.png.at(-1)!.url) : undefined;
  const { light = "#ffffff", dark = "#1e1e1e" } = data.app.branding;
  const alternates = data.config.languages.map((code) => `<link rel="alternate" hreflang="${esc(code)}" href="${esc(absolute(data, pageUrl(data, code)))}">`);
  const meta: Array<[string, string]> = [
    ["og:type", "website"],
    ["og:title", title],
    ["og:description", summary],
    ["og:url", url],
    ["og:site_name", name],
    ["og:locale", lang.replace(/-/g, "_")],
  ];
  if (ogImage) meta.push(["og:image", ogImage]);
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(summary)}">
<link rel="canonical" href="${esc(url)}">
${alternates.join("\n")}
<link rel="alternate" hreflang="x-default" href="${esc(absolute(data, data.config.base))}">
${meta.map(([property, content]) => `<meta property="${property}" content="${esc(content)}">`).join("\n")}
<meta name="twitter:card" content="${ogImage ? "summary_large_image" : "summary"}">
<meta name="theme-color" content="${esc(light)}" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="${esc(dark)}" media="(prefers-color-scheme: dark)">
${ctx.iconUrl ? `<link rel="icon" type="image/svg+xml" href="${esc(ctx.iconUrl)}">` : ""}
<style>:root{--brand-light:${esc(light)};--brand-dark:${esc(dark)}}</style>
${ctx.assets.css.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join("\n")}
<script type="module" src="${esc(ctx.assets.js)}"></script>`;
}

export function renderPage(ctx: RenderContext): string {
  const { data, lang, t } = ctx;
  const name = localized(data.app.name, lang);
  const developer = data.app.developer.name;
  const switcher = data.config.languages
    .map((code) => (code === lang ? `<li><span aria-current="true">${esc(languageName(code))}</span></li>` : `<li><a href="${esc(pageUrl(data, code))}" hreflang="${esc(code)}" lang="${esc(code)}">${esc(languageName(code))}</a></li>`))
    .join("");
  const legal = data.config.legal.map((link) => `<li><a href="${esc(link.url)}">${esc(link.label)}</a></li>`).join("");

  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
${head(ctx)}
</head>
<body>
<header class="hero">
<nav class="languages" aria-label="${esc(t("Language"))}"><ul>${switcher}</ul></nav>
<div class="hero-inner">
${ctx.iconUrl ? `<img class="icon" src="${esc(ctx.iconUrl)}" alt="" width="128" height="128">` : ""}
<div>
<h1>${esc(name)}</h1>
${developer ? `<p class="by">${fmt(t("by {developer}"), { developer })}</p>` : ""}
</div>
${downloadButton(ctx)}
</div>
${badges(ctx)}
</header>
<main>
${screenshotBand(ctx)}
<section class="about">
<h2>${esc(localized(data.app.summary, lang))}</h2>
${blocks(data.app.description, lang)}
</section>
${releases(ctx)}
${downloadList(ctx)}
${links(ctx)}
${tags(ctx)}
</main>
<footer>
<p>${esc(name)}${developer ? ` · ${esc(developer)}` : ""}${data.app.license ? ` · ${esc(data.app.license)}` : ""}</p>
${legal ? `<ul class="legal">${legal}</ul>` : ""}
</footer>
</body>
</html>
`;
}

/** The root page: a script picks the visitor's language, the link list is what everyone else (and every crawler) sees. */
export function renderRoot(data: SiteData, assets: ClientAssets, iconUrl: string | undefined): string {
  const { config } = data;
  const name = data.app.name.source;
  const choose = `var l=${JSON.stringify(config.languages)},d=${JSON.stringify(config.defaultLanguage)},p=(navigator.languages||[navigator.language]).map(function(x){return String(x).toLowerCase()}),c=d;for(var i=0;i<p.length;i++){var m=l.filter(function(x){return p[i]===x.toLowerCase()||p[i].split("-")[0]===x.toLowerCase()})[0];if(m){c=m;break}}location.replace(${JSON.stringify(config.base)}+c+"/")`;
  const alternates = config.languages.map((code) => `<link rel="alternate" hreflang="${esc(code)}" href="${esc(absolute(data, pageUrl(data, code)))}">`);
  return `<!doctype html>
<html lang="${esc(config.defaultLanguage)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(name)}</title>
<link rel="canonical" href="${esc(absolute(data, pageUrl(data, config.defaultLanguage)))}">
${alternates.join("\n")}
<link rel="alternate" hreflang="x-default" href="${esc(absolute(data, config.base))}">
${iconUrl ? `<link rel="icon" type="image/svg+xml" href="${esc(iconUrl)}">` : ""}
${assets.css.map((href) => `<link rel="stylesheet" href="${esc(href)}">`).join("\n")}
<script>${choose}</script>
</head>
<body class="root">
<main>
<h1>${esc(name)}</h1>
<ul class="languages-list">${config.languages.map((code) => `<li><a href="${esc(pageUrl(data, code))}" hreflang="${esc(code)}" lang="${esc(code)}">${esc(languageName(code))}</a></li>`).join("")}</ul>
</main>
</body>
</html>
`;
}
