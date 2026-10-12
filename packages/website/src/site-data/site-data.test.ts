import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseSiteConfig } from "./config.ts";
import { DOWNLOAD_LABELS, FORMAT_LABELS, buildDownloadTargets, classifyAsset, defaultLabel } from "./downloads.ts";
import { parseFlathubStats, parseFlathubSummary } from "./flathub.ts";
import { fetchLatestRelease, parseLatestRelease } from "./github.ts";
import { loadSiteData } from "./load.ts";
import { parseMetainfo } from "./metainfo.ts";
import { fetchJson } from "./network.ts";
import { minimumAge } from "./oars.ts";
import { completeLocalized, parseCatalog, resolveLocalized } from "./po.ts";
import { resolveVariant, validateVariants } from "./screenshots.ts";
import { epcPayload, formatIban, isValidBic, isValidIban } from "./sepa.ts";
import type { ReleaseAsset } from "./types.ts";

const root = resolve(fileURLToPath(import.meta.url), "../../../../..");

const asset = (name: string): ReleaseAsset => ({
  name,
  size: 1,
  downloadUrl: `https://example.org/${name}`,
  downloadCount: 2,
});

test("variant fallback follows the documented order", () => {
  const all = { "desktop-light": "dl", "desktop-dark": "dd", "mobile-light": "ml", "mobile-dark": "md" };
  assert.equal(resolveVariant(all, "mobile-dark"), "md");
  assert.equal(resolveVariant({ "desktop-light": "dl", "mobile-light": "ml" }, "mobile-dark"), "ml");
  assert.equal(resolveVariant({ "desktop-light": "dl", "desktop-dark": "dd" }, "mobile-dark"), "dd");
  assert.equal(resolveVariant({ "desktop-light": "dl" }, "mobile-dark"), "dl");
  assert.equal(resolveVariant({ "mobile-dark": "md", "desktop-dark": "dd" }, "mobile-light"), "md");
  assert.equal(resolveVariant({ "mobile-light": "ml", "desktop-dark": "dd" }, "desktop-light"), "dd");
  assert.equal(resolveVariant({ "mobile-light": "ml", "mobile-dark": "md" }, "desktop-dark"), "md");
  assert.equal(resolveVariant({ "mobile-light": "ml" }, "desktop-dark"), "ml");
  assert.equal(resolveVariant({}, "desktop-dark"), undefined);
});

test("a missing screenshot file fails with a clear message", () => {
  assert.throws(
    () => validateVariants({ "desktop-light": "nope.png" }, root, "#1"),
    /"nope.png", which does not exist/
  );
  assert.throws(() => validateVariants({}, root, "#2"), /no variants/);
});

test("release assets are classified per OS", () => {
  assert.deepEqual(classifyAsset(asset("Learn6502.AppImage")), { os: "linux", format: "appimage", arch: "noarch" });
  assert.equal(classifyAsset(asset("learn6502.msi"))?.os, "win32");
  assert.equal(classifyAsset(asset("Learn6502.dmg"))?.os, "darwin");
  assert.equal(classifyAsset(asset("SHA256SUMS")), null);
});

test("download targets: Flathub first on Linux, one recommendation per OS, web last", () => {
  const targets = buildDownloadTargets({
    assets: [asset("a.deb"), asset("a.AppImage"), asset("a.msi"), asset("a.dmg")],
    flathub: "eu.example.App",
    webAppUrl: "/x/app/",
  });
  assert.deepEqual(
    targets.map((target) => target.format),
    ["flathub", "appimage", "deb", "dmg", "msi", "web"]
  );
  assert.deepEqual(
    targets.filter((target) => target.recommended).map((target) => target.os),
    ["linux", "darwin", "win32", "web"]
  );
});

test("the store target carries a size: Flathub's own number, else the Flatpak bundle", () => {
  const bundle = { ...asset("a.flatpak"), size: 400_000 };
  const fromSummary = buildDownloadTargets({ assets: [bundle], flathub: "eu.example.App", flathubSize: 1_832_624 });
  assert.equal(fromSummary.find((target) => target.format === "flathub")?.size, 1_832_624);
  const fromBundle = buildDownloadTargets({ assets: [bundle], flathub: "eu.example.App" });
  assert.equal(fromBundle.find((target) => target.format === "flathub")?.size, 400_000);
  const neither = buildDownloadTargets({ assets: [], flathub: "eu.example.App" });
  assert.equal(neither.find((target) => target.format === "flathub")?.size, undefined);
  assert.equal(parseFlathubSummary({ download_size: 7, installed_size: 9 }).downloadSize, 7);
  assert.throws(() => parseFlathubSummary({}), /Unexpected Flathub summary/);
});

test("the real metainfo parses with its German strings and a 3+ age rating", () => {
  const xml = readFileSync(join(root, "packages/app-gnome/data/metainfo/eu.jumplink.Learn6502.metainfo.xml"), "utf8");
  const metainfo = parseMetainfo(xml);
  assert.equal(metainfo.id, "eu.jumplink.Learn6502");
  assert.ok(metainfo.name.source.length > 0);
  assert.ok(metainfo.summary.byLanguage.de);
  assert.ok(metainfo.releases.length > 0);
  assert.equal(minimumAge(metainfo.contentRating!.type, metainfo.contentRating!.attributes), 3);
});

test("metainfo links and brand colours that could break out of their context are dropped", () => {
  const xml = `<component><id>a.b.C</id><name>C</name>
<url type="homepage">javascript:alert(1)</url><url type="faq">https://example.org/faq</url>
<branding><color type="primary" scheme_preference="light">red;}</style><script></color>
<color type="primary" scheme_preference="dark">#1e1e1e</color></branding></component>`;
  const metainfo = parseMetainfo(xml);
  assert.deepEqual(metainfo.urls, { faq: "https://example.org/faq" });
  assert.deepEqual(metainfo.branding, { dark: "#1e1e1e" });
});

test("OARS: unknown content rating kinds yield no age", () => {
  assert.equal(minimumAge("oars-2.0", {}), undefined);
  assert.equal(minimumAge("oars-1.1", {}), 0);
  assert.equal(minimumAge("oars-1.1", { "violence-bloodshed": "intense" }), 18);
});

test("PO parsing and localized lookup", () => {
  const catalog = parseCatalog(
    `msgid ""\nmsgstr "Language: de\\n"\n\n#, fuzzy\nmsgid "Fuzzy"\nmsgstr "x"\n\nmsgid "Hello"\nmsgstr "Hallo"\n\nmsgid "Multi"\n"line"\nmsgstr "Mehr"\n"zeilig"\n`
  );
  assert.equal(catalog.get("Hello"), "Hallo");
  assert.equal(catalog.get("Multiline"), "Mehrzeilig");
  assert.equal(catalog.has("Fuzzy"), false);
  const text = { source: "Hello", byLanguage: { de: "Moin" } };
  assert.equal(resolveLocalized(text, "de", catalog), "Moin");
  assert.equal(resolveLocalized({ source: "Hello", byLanguage: {} }, "de", catalog), "Hallo");
  assert.equal(resolveLocalized({ source: "Nope", byLanguage: {} }, "de", catalog), "Nope");
  assert.deepEqual(
    completeLocalized({ source: "Hello", byLanguage: { fr: "Salut" } }, ["en", "de"], "en", { de: catalog }),
    {
      source: "Hello",
      byLanguage: { de: "Hallo" },
    }
  );
});

test("config validation names the offending key", () => {
  assert.throws(() => parseSiteConfig({}), /no "gjsify.site"/);
  assert.throws(() => parseSiteConfig({ gjsify: { site: { metainfo: "m.xml" } } }), /gjsify.site.url/);
  assert.throws(
    () =>
      parseSiteConfig({
        gjsify: {
          site: {
            metainfo: "m",
            base: "/x",
            url: "https://x",
            repository: "a/b",
            languages: ["en"],
            defaultLanguage: "de",
          },
        },
      }),
    /defaultLanguage/
  );
  const config = parseSiteConfig({
    gjsify: { site: { metainfo: "m", base: "x", url: "https://x", repository: "a/b" } },
  });
  assert.equal(config.base, "/x/");
  assert.equal(config.url, "https://x/");
  assert.deepEqual(config.languages, ["en"]);
  assert.equal(config.sourceLanguage, "en");

  const german = parseSiteConfig({
    gjsify: {
      site: {
        metainfo: "m",
        base: "x",
        url: "https://x",
        repository: "a/b",
        languages: ["de", "en"],
        defaultLanguage: "de",
      },
    },
  });
  assert.equal(german.defaultLanguage, "de");
  assert.equal(german.sourceLanguage, "en", "the landing language does not change the language of the source text");
});

test("GitHub and Flathub payloads", () => {
  const release = parseLatestRelease({
    tag_name: "v1",
    html_url: "u",
    assets: [{ name: "a.deb", size: 3, download_count: 4, browser_download_url: "https://x/a.deb" }, { nope: true }],
  });
  assert.equal(release.assets.length, 1);
  assert.equal(release.assets[0]!.downloadCount, 4);
  assert.throws(() => parseLatestRelease({}), /Unexpected/);
  assert.equal(parseFlathubStats({ installs_total: 5, installs_last_month: 1 }).installsTotal, 5);
  assert.throws(() => parseFlathubStats({}), /Unexpected/);
});

test("fetchJson rejects on HTTP errors", async () => {
  const failing = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(fetchJson("https://x", {}, { fetch: failing }));
});

test("loadSiteData degrades to warnings when the network fails", async () => {
  const warnings: string[] = [];
  const data = await loadSiteData({
    root,
    warn: (message) => warnings.push(message),
    network: { fetch: async () => Promise.reject(new Error("offline")) },
  });
  assert.equal(data.latestRelease, null);
  assert.equal(data.stats.githubDownloads, undefined);
  // One per endpoint: the GitHub release, the Flathub statistics and the Flathub summary.
  assert.equal(warnings.length, 3);
  assert.ok(data.downloads.targets.some((target) => target.format === "flathub"));
  assert.equal(data.screenshots.length, 6);
  assert.equal(data.screenshots[4]!.caption?.source, "Runs on macOS");
  assert.equal(data.version, "0.8.0");
});

test("configured downloads: stores and source join the list, unavailable ones are never recommended", () => {
  const config = parseSiteConfig({
    gjsify: {
      site: {
        metainfo: "m",
        base: "x",
        url: "https://x",
        repository: "a/b",
        releaseAssets: false,
        downloads: [
          { platform: "firefox", format: "store", available: false },
          { platform: "firefox", format: "source", url: "https://example.org/install" },
          { platform: "chromium", format: "store", available: false, label: "Chrome Web Store" },
        ],
      },
    },
  });
  assert.equal(config.releaseAssets, false);
  const targets = buildDownloadTargets({ assets: [], configured: config.downloads });
  assert.deepEqual(
    targets.map((target) => [target.os, target.format, target.available, target.recommended]),
    [
      ["firefox", "store", false, false],
      ["firefox", "source", true, true],
      ["chromium", "store", false, false],
    ]
  );
  assert.equal(targets[0]!.label, "Firefox Add-ons");
  assert.equal(targets[0]!.url, "");
  assert.throws(
    () =>
      parseSiteConfig({
        gjsify: {
          site: {
            metainfo: "m",
            base: "x",
            url: "https://x",
            repository: "a/b",
            downloads: [{ platform: "firefox", format: "source" }],
          },
        },
      }),
    /downloads\[0\].url/
  );
  assert.throws(
    () =>
      parseSiteConfig({
        gjsify: {
          site: {
            metainfo: "m",
            base: "x",
            url: "https://x",
            repository: "a/b",
            downloads: [{ platform: "beos", format: "zip", url: "https://x" }],
          },
        },
      }),
    /downloads\[0\].platform/
  );
});

test("extension files in a release are classified by browser", () => {
  assert.deepEqual(classifyAsset(asset("app-1.0-firefox-mv2.zip")), { os: "firefox", format: "zip", arch: "noarch" });
  assert.deepEqual(classifyAsset(asset("app-1.0.xpi")), { os: "firefox", format: "xpi", arch: "noarch" });
  assert.equal(classifyAsset(asset("app-1.0-chrome-mv3.zip"))?.os, "chromium");
});

test("a repository without a release is a state, not an error", async () => {
  const notFound = async () => ({ ok: false, status: 404, json: async () => ({}) });
  assert.equal(await fetchLatestRelease("a/b", undefined, { fetch: notFound }), null);
  const unavailable = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(fetchLatestRelease("a/b", undefined, { fetch: unavailable }));
});

test("defaultLabel: platform wording wins, every other format gets its own label, never the raw id", () => {
  assert.equal(defaultLabel("firefox", "store"), "Firefox Add-ons");
  assert.equal(defaultLabel("firefox", "source"), "Build from source");
  assert.equal(defaultLabel("linux", "source"), "Source code");
  assert.equal(defaultLabel("android", "store"), "Store");
  assert.equal(defaultLabel("chromium", "xpi"), "Firefox add-on");
  for (const [format, text] of Object.entries(FORMAT_LABELS)) assert.notEqual(text, format);
  for (const key of Object.keys(DOWNLOAD_LABELS)) assert.ok(DOWNLOAD_LABELS[key]);
});

test("IBAN validation checks format and the mod-97 checksum", () => {
  assert.equal(isValidIban("DE89370400440532013000"), true);
  assert.equal(isValidIban("GB82WEST12345698765432"), true);
  assert.equal(isValidIban("DE89370400440532013001"), false);
  assert.equal(isValidIban("DE8937040044053201300"), false);
  assert.equal(isValidIban("de89370400440532013000"), false, "expects a normalised IBAN");
  assert.equal(isValidIban("1234"), false);
  assert.equal(formatIban("de89 3704 0044 0532 0130 00"), "DE89 3704 0044 0532 0130 00");
  assert.equal(isValidBic("COBADEFFXXX"), true);
  assert.equal(isValidBic("COBADEFF"), true);
  assert.equal(isValidBic("COBADE"), false);
});

test("the EPC payload follows EPC069-12 v002", () => {
  assert.equal(
    epcPayload({ name: "Max Müller", iban: "DE89 3704 0044 0532 0130 00", bic: "COBADEFFXXX", reference: "Spende" }),
    "BCD\n002\n1\nSCT\nCOBADEFFXXX\nMax Müller\nDE89370400440532013000\n\n\n\nSpende"
  );
  assert.equal(epcPayload({ name: "X", iban: "DE89370400440532013000" }), "BCD\n002\n1\nSCT\n\nX\nDE89370400440532013000\n\n\n\n");
});

test("support entries: links stay valid, a sepa entry is validated at load", () => {
  const base = (support: unknown[]) => ({
    version: "1.0.0",
    gjsify: { site: { metainfo: "m.xml", base: "/x/", url: "https://example.org/x", repository: "o/r", support } },
  });
  const [link, sepa] = parseSiteConfig(base([{ kind: "Sponsor", url: "https://example.org/s" }, { kind: "sepa", name: "N", iban: "de89 3704 0044 0532 0130 00", bic: "cobadeffxxx" }])).support;
  assert.deepEqual(link, { kind: "Sponsor", url: "https://example.org/s" });
  assert.deepEqual(sepa, { kind: "sepa", name: "N", iban: "DE89370400440532013000", bic: "COBADEFFXXX", reference: undefined });
  assert.throws(() => parseSiteConfig(base([{ kind: "sepa", name: "N", iban: "DE89370400440532013001" }])), /support\[0\]\.iban is not a valid IBAN/);
  assert.throws(() => parseSiteConfig(base([{ kind: "sepa", iban: "DE89370400440532013000" }])), /support\[0\]\.name/);
  assert.throws(() => parseSiteConfig(base([{ kind: "sepa", name: "N", iban: "DE89370400440532013000", bic: "XX" }])), /bic is not a valid BIC/);
});
