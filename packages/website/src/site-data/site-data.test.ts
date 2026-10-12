import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parseSiteConfig } from "./config.ts";
import { buildDownloadTargets, classifyAsset } from "./downloads.ts";
import { parseFlathubStats } from "./flathub.ts";
import { parseLatestRelease } from "./github.ts";
import { loadSiteData } from "./load.ts";
import { parseMetainfo } from "./metainfo.ts";
import { fetchJson } from "./network.ts";
import { minimumAge } from "./oars.ts";
import { completeLocalized, parseCatalog, resolveLocalized } from "./po.ts";
import { resolveVariant, validateVariants } from "./screenshots.ts";
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

test("the real metainfo parses with its German strings and a 3+ age rating", () => {
  const xml = readFileSync(join(root, "packages/app-gnome/data/metainfo/eu.jumplink.Learn6502.metainfo.xml"), "utf8");
  const metainfo = parseMetainfo(xml);
  assert.equal(metainfo.id, "eu.jumplink.Learn6502");
  assert.ok(metainfo.name.source.length > 0);
  assert.ok(metainfo.summary.byLanguage.de);
  assert.ok(metainfo.releases.length > 0);
  assert.equal(minimumAge(metainfo.contentRating!.type, metainfo.contentRating!.attributes), 3);
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
  assert.equal(warnings.length, 2);
  assert.ok(data.downloads.targets.some((target) => target.format === "flathub"));
  assert.equal(data.screenshots.length, 6);
  assert.equal(data.screenshots[4]!.caption?.source, "Runs on macOS");
  assert.equal(data.version, "0.8.0");
});
