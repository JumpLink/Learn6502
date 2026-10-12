import assert from "node:assert/strict";
import { test } from "node:test";
import type { DownloadTarget } from "../site-data/index.ts";
import { ctaLabel } from "./pages.ts";

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
