import assert from "node:assert/strict";
import { test } from "node:test";
import type { DownloadTarget, Screenshot } from "../site-data/index.ts";
import type { ProcessedImage } from "./images.ts";
import { ctaLabel, frameAttribute, sepaCard } from "./pages.ts";

const t = (msgid: string) => msgid;
const target = (os: DownloadTarget["os"], format: DownloadTarget["format"]): DownloadTarget => ({
  os,
  arch: "noarch",
  format,
  label: "",
  url: "https://example.org/",
  available: true,
  recommended: true,
});

test("ctaLabel describes the recommended target, not just its group", () => {
  assert.equal(ctaLabel(target("linux", "flathub"), t), "Install from Flathub");
  assert.equal(ctaLabel(target("linux", "appimage"), t), "Download for Linux");
  assert.equal(ctaLabel(target("web", "web"), t), "Try in browser");
  assert.equal(ctaLabel(target("chromium", "source"), t), "Build from source");
  assert.equal(ctaLabel(target("linux", "source"), t), "Build from source");
  assert.equal(ctaLabel(target("firefox", "store"), t), "Add to Firefox");
  assert.equal(ctaLabel(target("firefox", "xpi"), t), "Install for Firefox");
});

test("frameAttribute drops our frame only where the chosen source is a window shot", () => {
  const image = (frameless: boolean) => ({ frameless }) as ProcessedImage;
  const images = new Map([
    ["window.png", image(true)],
    ["phone.png", image(false)],
  ]);
  const shot = (variants: Screenshot["variants"]): Screenshot => ({ caption: null, variants });
  assert.equal(frameAttribute({ images }, shot({ "desktop-light": "window.png" })), "none");
  assert.equal(frameAttribute({ images }, shot({ "desktop-light": "phone.png" })), undefined);
  assert.equal(frameAttribute({ images }, shot({ "desktop-light": "window.png", "mobile-light": "phone.png" })), "none-desktop");
  assert.equal(frameAttribute({ images }, shot({ "desktop-light": "phone.png", "mobile-light": "window.png" })), "none-mobile");
});

test("sepaCard shows the grouped IBAN, the details and an inline QR code", () => {
  const html = sepaCard({ kind: "sepa", name: "Example & Co", iban: "DE89370400440532013000", bic: "COBADEFFXXX", reference: "Donation" }, t);
  assert.match(html, /DE89 3704 0044 0532 0130 00/);
  assert.match(html, /data-copy="DE89370400440532013000"/);
  assert.match(html, /Example &amp; Co/);
  assert.match(html, /COBADEFFXXX/);
  assert.match(html, /<svg class="qr"[^>]*viewBox="0 0 \d+ \d+"/);
  assert.match(html, /Scan with your banking app/);
  assert.doesNotMatch(sepaCard({ kind: "sepa", name: "X", iban: "DE89370400440532013000" }, t), /BIC|Reference/);
});
