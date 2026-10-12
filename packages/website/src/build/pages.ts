import { isBrowserPlatform, PLATFORM_ORDER, pickByLanguage, resolveVariant, type DescriptionBlock, type DownloadTarget, type Localized, type Release, type Screenshot, type ScreenshotVariantKey, type SiteData, type TargetPlatform } from "../site-data/index.ts";
import { attrs, esc, fmt, plain } from "./html.ts";
import { icon, type IconName } from "./icons.ts";
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

type Translate = (msgid: string) => string;

const MOBILE = "(max-width: 600px)";
const DARK = "(prefers-color-scheme: dark)";
const FORMAT_TYPES: Record<ImageFormat, string> = { avif: "image/avif", webp: "image/webp", png: "image/png" };
const SIZES = "(max-width: 600px) 92vw, (max-width: 1000px) 86vw, 860px";

type LinkKey = "homepage" | "help" | "faq" | "vcsBrowser" | "bugtracker" | "contribute" | "translate" | "contact" | "donation";

const LINKS: Array<[key: LinkKey, label: (t: Translate) => string, glyph: IconName]> = [
  ["homepage", (t) => t("Website"), "web"],
  ["help", (t) => t("Help"), "help"],
  ["faq", (t) => t("FAQ"), "help"],
  ["vcsBrowser", (t) => t("Source code"), "code"],
  ["bugtracker", (t) => t("Report an issue"), "bug"],
  ["contribute", (t) => t("Contribute"), "people"],
  ["translate", (t) => t("Help translate"), "translate"],
  ["contact", (t) => t("Contact"), "mail"],
  ["donation", (t) => t("Donate"), "heart"],
];

const PLATFORM_ICONS: Record<TargetPlatform, IconName> = { linux: "linux", darwin: "macos", win32: "windows", android: "android", web: "web", firefox: "firefox", chromium: "chromium" };

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

function osName(os: TargetPlatform, t: Translate): string {
  return { linux: t("Linux"), darwin: t("macOS"), win32: t("Windows"), android: t("Android"), web: t("Web"), firefox: t("Firefox"), chromium: t("Chromium") }[os];
}

function sizeLabel(bytes: number | undefined, lang: string): string {
  if (!bytes) return "";
  return `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

/** The second line of a link card: the address without the noise a reader does not need. */
function prettyUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol === "mailto:") return parsed.pathname;
  const host = parsed.host.replace(/^www\./, "");
  const path = parsed.pathname.replace(/\/$/, "");
  return `${host}${path}`;
}

/**
 * What the primary button says. Installing from a store, opening the web build and downloading a
 * file are three different promises, so each gets its own wording.
 */
export function ctaLabel(target: DownloadTarget, t: Translate): string {
  if (target.format === "flathub") return t("Install from Flathub");
  if (target.format === "source") return t("Build from source");
  if (target.os === "web" && target.format === "web") return t("Try in browser");
  if (isBrowserPlatform(target.os)) {
    return plain(target.format === "store" ? t("Add to {browser}") : t("Install for {browser}"), { browser: osName(target.os, t) });
  }
  return plain(t("Download for {os}"), { os: osName(target.os, t) });
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

/** The brand-coloured band around the screenshots, the one place the app's own colours take over. */
function screenshotBand(ctx: RenderContext): string {
  if (ctx.data.screenshots.length === 0) return "";
  const { t, lang } = ctx;
  const slides = ctx.data.screenshots.map((screenshot, index) => {
    const caption = screenshot.caption ? localized(screenshot.caption, lang) : "";
    const alt = caption || plain(t("Screenshot {number}"), { number: index + 1 });
    const label = plain(t("{number} of {total}"), { number: index + 1, total: ctx.data.screenshots.length });
    return `<li class="slide" role="group" aria-roledescription="${esc(t("slide"))}" aria-label="${esc(label)}">
<figure>
${picture(ctx, screenshot, alt, index === 0)}
${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
<button class="slide-expand" type="button" aria-label="${esc(t("View full screen"))}" hidden>${icon("expand")}</button>
</figure>
</li>`;
  });
  // The controls carry translated labels, so they are rendered here and only unhidden by the component.
  const dots = ctx.data.screenshots.map(
    (_screenshot, index) => `<li><button class="carousel-dot" type="button" aria-label="${esc(plain(t("Screenshot {number}"), { number: index + 1 }))}"></button></li>`
  );
  return `<section class="band" aria-label="${esc(t("Screenshots"))}">
<screenshot-carousel class="carousel" role="group" aria-roledescription="${esc(t("carousel"))}" aria-label="${esc(t("Screenshots"))}">
<button class="carousel-arrow carousel-prev" type="button" aria-label="${esc(t("Previous screenshot"))}" hidden>${icon("chevron-left")}</button>
<ul class="carousel-track" aria-label="${esc(t("Screenshots"))}">
${slides.join("\n")}
</ul>
<button class="carousel-arrow carousel-next" type="button" aria-label="${esc(t("Next screenshot"))}" hidden>${icon("chevron-right")}</button>
<ol class="carousel-dots" hidden>${dots.join("")}</ol>
<dialog class="lightbox" aria-label="${esc(t("Screenshots"))}">
<button class="dialog-close" type="button" aria-label="${esc(t("Close"))}" hidden>${icon("close")}</button>
<figure></figure>
</dialog>
</screenshot-carousel>
</section>`;
}

/** The build the page offers before any browser detection: a store install if there is one. */
function defaultTarget(targets: readonly DownloadTarget[]): DownloadTarget | undefined {
  const available = targets.filter((target) => target.available);
  return available.find((target) => target.recommended && target.os === "linux") ?? available.find((target) => target.recommended) ?? available[0];
}

/**
 * One row of the download dialog. The data attributes carry everything the client needs to put a
 * row on the primary button, so it never has to build a translated string itself.
 */
function targetItem(target: DownloadTarget, ctx: RenderContext): string {
  const { t, lang } = ctx;
  const size = sizeLabel(target.size, lang);
  const meta = [
    target.arch === "noarch" ? "" : target.arch,
    target.recommended ? t("Recommended") : "",
    target.available ? "" : t("Not yet available"),
  ]
    .filter(Boolean)
    .join(" · ");
  const inner = `<span class="target-icon">${icon(target.format === "flathub" || target.format === "store" ? "package" : "download")}</span>
<span class="target-text"><span class="target-name">${esc(t(target.label))}</span>${meta ? `<span class="target-meta">${esc(meta)}</span>` : ""}</span>
${size ? `<span class="target-size">${esc(size)}</span>` : ""}`;
  return `<li${attrs({
    class: "target",
    "data-os": target.os,
    "data-arch": target.arch,
    "data-recommended": target.recommended,
    "data-unavailable": !target.available,
    "data-cta": target.available ? ctaLabel(target, t) : undefined,
    "data-size": size || undefined,
  })}>
${target.available ? `<a href="${esc(target.url)}">\n${inner}\n</a>` : `<span class="target-link">\n${inner}\n</span>`}
</li>`;
}

/**
 * The split button plus the dialog holding every target. Both are server-rendered: without
 * JavaScript the dialog stays an open panel below the button (see `site.css`), with it the
 * component turns the same markup into a modal and swaps the button for the detected platform.
 */
function downloadWidget(ctx: RenderContext): string {
  const { data, t } = ctx;
  const targets = data.downloads.targets;
  const primary = defaultTarget(targets);
  if (!primary) {
    // Nothing downloadable yet: point at the releases, or at the source when there are none.
    const [href, label] = data.downloads.hasReleases
      ? [data.downloads.releasesUrl, t("All releases")]
      : [repositoryUrl(data) ?? data.downloads.releasesUrl, t("Source code")];
    return `<div class="download">
<a class="button download-cta" href="${esc(href)}">${icon("download")}<span class="download-label">${esc(label)}</span></a>
</div>`;
  }
  const groups = PLATFORM_ORDER.flatMap((os) => {
    const own = targets.filter((target) => target.os === os);
    return own.length > 0 ? [[os, own] as const] : [];
  });
  const tabs = groups.map(
    ([os]) =>
      `<button class="os-tab" type="button" role="tab" id="os-tab-${esc(os)}" aria-controls="os-group-${esc(os)}" data-os="${esc(os)}" aria-selected="${os === primary.os}">${icon(PLATFORM_ICONS[os])}<span>${esc(osName(os, t))}</span></button>`
  );
  const sections = groups.map(
    ([os, own]) => `<section class="os-group" id="os-group-${esc(os)}" role="tabpanel" aria-labelledby="os-tab-${esc(os)}" data-os="${esc(os)}">
<h3>${icon(PLATFORM_ICONS[os])}<span>${esc(osName(os, t))}</span></h3>
<ul>
${own.map((target) => targetItem(target, ctx)).join("\n")}
</ul>
${os === "darwin" ? `<p class="os-note">${esc(t("Apple Silicon is assumed. Pick the Intel build if your Mac has an Intel processor."))}</p>` : ""}
</section>`
  );
  return `<app-download class="download">
<div class="download-split">
<a class="button download-cta" href="${esc(primary.url)}"${attrs({ "data-os": primary.os, "data-arch": primary.arch })}>${icon("download")}<span class="download-label">${esc(ctaLabel(primary, t))}</span></a>
<a class="button download-toggle" href="#all-downloads" aria-label="${esc(t("All download options"))}">${icon("chevron-down")}</a>
</div>
<dialog id="all-downloads" class="download-dialog" aria-labelledby="all-downloads-title">
<div class="dialog-head">
<h2 id="all-downloads-title">${esc(t("All download options"))}</h2>
<button class="dialog-close" type="button" aria-label="${esc(t("Close"))}" hidden>${icon("close")}</button>
</div>
<div class="os-tabs" role="tablist" aria-label="${esc(t("Operating system"))}" hidden>${tabs.join("")}</div>
<div class="os-groups">
${sections.join("\n")}
</div>
${data.downloads.hasReleases ? `<p class="dialog-foot"><a href="${esc(data.downloads.releasesUrl)}">${esc(t("All releases on GitHub"))}${icon("external", { class: "link-external" })}</a></p>` : ""}
</dialog>
</app-download>`;
}

interface BadgeSpec {
  /** Drawn in the pill; `pill` wins when a badge needs more than one glyph. */
  glyph?: IconName;
  pill?: string;
  value: string;
  label: string;
  /** The unabbreviated fact, when the badge shows a short form of it. */
  title?: string;
  class?: string;
  hidden?: boolean;
}

function badge(spec: BadgeSpec): string {
  return `<li${attrs({ class: spec.class ? `badge ${spec.class}` : "badge", hidden: spec.hidden })}>
<span class="badge-pill">${spec.pill ?? icon(spec.glyph!)}</span>
<span${attrs({ class: "badge-value", title: spec.title })}>${esc(spec.value)}</span>
<span class="badge-label">${esc(spec.label)}</span>
</li>`;
}

/** `GPL-3.0-or-later` is too long for a badge; the full id stays in the title. */
function shortLicense(id: string): string {
  return id.replace(/-or-later$/, "+").replace(/-only$/, "");
}

/**
 * The facts row under the hero. A badge whose fact is missing is left out, not faked, and the row
 * tells CSS how many it ended up with so the columns divide the width evenly.
 */
function badges(ctx: RenderContext): string {
  const { data, t, lang } = ctx;
  const number = new Intl.NumberFormat(lang, { notation: "compact", maximumFractionDigits: 1 });
  const targets = data.downloads.targets;
  const specs: BadgeSpec[] = [];

  const primary = defaultTarget(targets);
  if (primary) {
    // Not every target reports a size; the client swaps this one as the reader picks another.
    const size = sizeLabel(primary.size, lang);
    specs.push({ glyph: "download", value: size, label: t("Download size"), class: "badge-size", hidden: !size });
  }
  if (data.app.license) {
    const short = shortLicense(data.app.license);
    specs.push({ glyph: "license", value: short, label: t("License"), title: short === data.app.license ? undefined : data.app.license });
  }
  const oses = PLATFORM_ORDER.filter((os) => targets.some((target) => target.available && target.os === os));
  if (oses.length > 0) {
    const glyphs = oses.map((os) => icon(PLATFORM_ICONS[os], { title: osName(os, t) })).join("");
    const label = oses.every(isBrowserPlatform) ? t("Browsers") : t("Platforms");
    specs.push({ pill: `<span class="badge-platforms">${glyphs}</span>`, value: "", label });
  }
  if (data.app.ageRating) {
    const { minAge } = data.app.ageRating;
    specs.push({ glyph: "people", value: minAge === 0 ? t("All ages") : plain(t("{age}+"), { age: minAge }), label: t("Age rating") });
  }
  if (data.stats.flathubInstalls !== undefined) specs.push({ glyph: "package", value: number.format(data.stats.flathubInstalls), label: t("Installs") });

  if (specs.length === 0) return "";
  const visible = specs.filter((spec) => !spec.hidden).length;
  const odd = visible % 2 === 1 ? ' data-odd="true"' : "";
  return `<ul class="badges" style="--badge-count:${visible}"${odd}>\n${specs.map(badge).join("\n")}\n</ul>`;
}

function releaseDate(date: string, lang: string): string {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? date : new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(parsed);
}

function datePill(release: Release, lang: string): string {
  return `<p class="date-pill"><time datetime="${esc(release.date)}">${esc(releaseDate(release.date, lang))}</time></p>`;
}

/**
 * The latest release as a card, older ones folded away. The "show more" button is rendered
 * hidden and the body unclamped: a reader without JavaScript gets the whole text, which a closed
 * `<details>` would have hidden instead.
 */
function releases(ctx: RenderContext): string {
  // A release without notes would render an empty card: it only has a version and a date.
  const [latest, ...older] = ctx.data.releases.filter((release) => release.description.length > 0);
  if (!latest) return "";
  const { t, lang } = ctx;
  return `<section class="releases">
<release-notes class="card release"${attrs({ "data-more": t("Show more"), "data-less": t("Show less") })}>
<div class="release-head">
<h2>${fmt(t("Changes in version {version}"), { version: latest.version })}</h2>
${datePill(latest, lang)}
</div>
<div class="release-body">
${blocks(latest.description, lang)}
</div>
<button class="release-more" type="button" hidden>${esc(t("Show more"))}</button>
</release-notes>
${
    older.length > 0
      ? `<details class="card older">
<summary>${esc(t("Older releases"))}${icon("chevron-down", { class: "summary-chevron" })}</summary>
${older
          .map(
            (release) => `<article class="release-old">
<div class="release-head">
<h3>${fmt(t("Changes in version {version}"), { version: release.version })}</h3>
${datePill(release, lang)}
</div>
${blocks(release.description, lang)}
</article>`
          )
          .join("\n")}
</details>`
      : ""
  }
</section>`;
}

function linkCard(href: string, title: string, glyph: IconName): string {
  return `<li>
<a href="${esc(href)}">
<span class="link-icon">${icon(glyph)}</span>
<span class="link-text"><span class="link-title">${esc(title)}</span><span class="link-url">${esc(prettyUrl(href))}</span></span>
${icon("external", { class: "link-external" })}
</a>
</li>`;
}

/** Same address, trailing slash or not. */
function sameUrl(a: string, b: string): boolean {
  return a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
}

function links(ctx: RenderContext): string {
  const { data, t } = ctx;
  const items = LINKS.flatMap(([key, label, glyph]) => {
    const href = data.app.urls[key];
    // No point linking the page the reader is on: the metainfo's homepage is often this site.
    if (!href || (key === "homepage" && sameUrl(href, data.config.url))) return [];
    return [linkCard(href, label(t), glyph)];
  });
  if (data.config.flathub) items.unshift(linkCard(`https://flathub.org/apps/${data.config.flathub}`, "Flathub", "package"));
  if (items.length === 0) return "";
  return `<section class="links">
<h2>${esc(t("Links"))}</h2>
<ul class="card-list">
${items.join("\n")}
</ul>
</section>`;
}

/**
 * Ways to support the project, if the site configures any. Same no-JavaScript shape as the
 * download dialog: an anchor to a dialog that stays an open panel until the component takes over.
 */
function support(ctx: RenderContext): string {
  const { data, t } = ctx;
  if (data.config.support.length === 0) return "";
  return `<section class="support">
<app-support class="support-widget">
<a class="button support-cta" href="#support-ways">${icon("heart")}<span>${esc(t("Support this project"))}</span></a>
<dialog id="support-ways" class="support-dialog" aria-labelledby="support-ways-title">
<div class="dialog-head">
<h2 id="support-ways-title">${esc(t("Support this project"))}</h2>
<button class="dialog-close" type="button" aria-label="${esc(t("Close"))}" hidden>${icon("close")}</button>
</div>
<ul class="card-list">
${data.config.support.map((link) => linkCard(link.url, t(link.kind), "heart")).join("\n")}
</ul>
</dialog>
</app-support>
</section>`;
}

function tags(ctx: RenderContext): string {
  const { data, t, lang } = ctx;
  const keywords = data.app.keywords.map((keyword) => localized(keyword, lang));
  const arches = [...new Set(data.downloads.targets.map((target) => target.arch).filter((arch) => arch !== "noarch"))];
  const list = (label: string, values: string[]) =>
    values.length === 0 ? "" : `<div class="tag-group"><h3>${esc(label)}</h3><ul class="tags">${values.map((value) => `<li>${esc(value)}</li>`).join("")}</ul></div>`;
  const body = [list(t("Categories"), data.app.categories), list(t("Keywords"), keywords), list(t("Architectures"), arches)].join("\n");
  return body.trim() ? `<section class="tags-section">\n${body}\n</section>` : "";
}

function languageSwitch(ctx: RenderContext, className: string, style: "code" | "name"): string {
  const { data, lang, t } = ctx;
  const items = data.config.languages.map((code) => {
    const label = style === "code" ? code.toUpperCase() : languageName(code);
    return code === lang
      ? `<li><span aria-current="true">${esc(label)}</span></li>`
      : `<li><a href="${esc(pageUrl(data, code))}" hreflang="${esc(code)}" lang="${esc(code)}">${esc(label)}</a></li>`;
  });
  return `<nav class="${className}" aria-label="${esc(t("Language"))}"><ul>${items.join("")}</ul></nav>`;
}

function repositoryUrl(data: SiteData): string | undefined {
  return data.app.urls.vcsBrowser ?? (data.config.repository || undefined);
}

function topBar(ctx: RenderContext): string {
  const { data, lang, t } = ctx;
  const repo = repositoryUrl(data);
  const onGitHub = repo ? /(^|\.)github\.com$/.test(new URL(repo).host) : false;
  return `<div class="topbar">
<div class="bar-inner">
<a class="bar-brand" href="${esc(pageUrl(data, lang))}">
${ctx.iconUrl ? `<img src="${esc(ctx.iconUrl)}" alt="" width="24" height="24">` : ""}
<span>${esc(localized(data.app.name, lang))}</span>
</a>
<div class="bar-end">
${languageSwitch(ctx, "bar-languages", "code")}
${repo ? `<a class="bar-link" href="${esc(repo)}">${icon("code")}<span>${onGitHub ? "GitHub" : esc(t("Source code"))}</span></a>` : ""}
</div>
</div>
</div>`;
}

function hero(ctx: RenderContext): string {
  const { data, lang, t } = ctx;
  const developer = data.app.developer.name;
  return `<header class="hero">
<div class="hero-inner">
${ctx.iconUrl ? `<div class="hero-icon" style="--icon-url:url(${esc(ctx.iconUrl)})"><img src="${esc(ctx.iconUrl)}" alt="" width="128" height="128"></div>` : ""}
<div class="hero-text">
<h1>${esc(localized(data.app.name, lang))}</h1>
${developer ? `<p class="hero-by">${fmt(t("by {developer}"), { developer })}</p>` : ""}
</div>
${downloadWidget(ctx)}
</div>
${badges(ctx)}
</header>`;
}

function footer(ctx: RenderContext): string {
  const { data, lang, t } = ctx;
  const name = localized(data.app.name, lang);
  const repo = repositoryUrl(data);
  const legal = data.config.legal.map((link) => `<li><a href="${esc(link.url)}">${esc(link.label)}</a></li>`).join("");
  const licenses = [
    data.app.license ? fmt(t("{app} is licensed under {license}."), { app: name, license: data.app.license }) : "",
    data.app.contentLicense ? fmt(t("This page reproduces text licensed under {license}."), { license: data.app.contentLicense }) : "",
  ].filter(Boolean);
  return `<footer class="footer">
<div class="footer-inner">
${languageSwitch(ctx, "footer-languages", "name")}
${repo ? `<p class="footer-source"><a href="${esc(repo)}">${icon("code")}<span>${esc(t("Source code"))}</span></a></p>` : ""}
${licenses.length > 0 ? `<p class="footer-license">${licenses.join(" ")}</p>` : ""}
<p class="footer-made"><a href="https://github.com/gjsify/gjsify">${esc(plain(t("Made with {project}"), { project: "gjsify" }))}</a></p>
${legal ? `<ul class="footer-legal">${legal}</ul>` : ""}
</div>
</footer>`;
}

function head(ctx: RenderContext): string {
  const { data, lang } = ctx;
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
  const { data, lang } = ctx;
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
${head(ctx)}
</head>
<body>
${topBar(ctx)}
${hero(ctx)}
<main>
${screenshotBand(ctx)}
<div class="column">
<section class="about">
<h2>${esc(localized(data.app.summary, lang))}</h2>
${blocks(data.app.description, lang)}
</section>
${releases(ctx)}
${support(ctx)}
${links(ctx)}
${tags(ctx)}
</div>
</main>
${footer(ctx)}
</body>
</html>
`;
}

/** The root page: a script picks the visitor's language, the link list is what everyone else (and every crawler) sees. */
export function renderRoot(data: SiteData, assets: ClientAssets, iconUrl: string | undefined): string {
  const { config } = data;
  const name = data.app.name.source;
  const json = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");
  const choose = `var l=${json(config.languages)},d=${json(config.defaultLanguage)},p=(navigator.languages||[navigator.language]).map(function(x){return String(x).toLowerCase()}),c=d;for(var i=0;i<p.length;i++){var m=l.filter(function(x){return p[i]===x.toLowerCase()||p[i].split("-")[0]===x.toLowerCase()})[0];if(m){c=m;break}}location.replace(${json(config.base)}+c+"/")`;
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
