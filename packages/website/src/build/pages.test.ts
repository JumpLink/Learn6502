import assert from "node:assert/strict";
import { test } from "node:test";
import type { DownloadTarget, Screenshot } from "../site-data/index.ts";
import type { ProcessedImage } from "./images.ts";
import { ctaLabel, frameAttribute } from "./pages.ts";

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
