import assert from "node:assert/strict";
import { test } from "node:test";
import {
  detectArch,
  detectBrowser,
  detectOs,
  detectPlatform,
  inGroup,
  recommendTarget,
  type TargetChoice,
} from "./platform.ts";

const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:142.0) Gecko/20100101 Firefox/142.0";
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";
const SAFARI_IPAD =
  "Mozilla/5.0 (iPad; CPU OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.6 Safari/605.1.15";

const target = (os: TargetChoice["os"], arch: TargetChoice["arch"], recommended = false): TargetChoice => ({
  os,
  arch,
  recommended,
});

const TARGETS: TargetChoice[] = [
  target("linux", "noarch", true),
  target("linux", "x86_64"),
  target("darwin", "arm64", true),
  target("darwin", "x86_64"),
  target("win32", "x86_64", true),
  target("web", "noarch", true),
];

test("the OS comes from the platform hint, or the user agent", () => {
  assert.equal(detectOs({ platform: "Windows" }), "win32");
  assert.equal(detectOs({ platform: "macOS" }), "darwin");
  assert.equal(detectOs({ platform: "Linux" }), "linux");
  assert.equal(detectOs({ platform: "Chrome OS" }), "linux");
  assert.equal(detectOs({ userAgent: FIREFOX_LINUX }), "linux");
  assert.equal(detectOs({ userAgent: SAFARI_MAC }), "darwin");
  assert.equal(detectOs({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }), "win32");
  assert.equal(detectOs({}), undefined);
});

test("Android wins over the Linux its user agent also claims", () => {
  assert.equal(detectOs({ userAgent: CHROME_ANDROID }), "android");
  assert.equal(detectOs({ platform: "Android", userAgent: CHROME_ANDROID }), "android");
});

test("iOS and iPadOS get the browser build, the only one that runs there", () => {
  assert.equal(detectOs({ userAgent: SAFARI_IPAD }), "web");
  assert.equal(detectOs({ platform: "iOS" }), "web");
});

test("the architecture is only trusted when it is reported", () => {
  assert.equal(detectArch({ architecture: "arm", bitness: "64" }), "arm64");
  assert.equal(detectArch({ architecture: "x86", bitness: "64" }), "x86_64");
  assert.equal(detectArch({ architecture: "x86", bitness: "32" }), undefined);
  assert.equal(detectArch({ architecture: "ppc", bitness: "64" }), undefined);
  assert.equal(detectArch({ userAgent: FIREFOX_LINUX }), "x86_64");
  assert.equal(detectArch({ userAgent: "Mozilla/5.0 (Macintosh; ARM64 Mac OS X)" }), "arm64");
  assert.equal(detectArch({ userAgent: SAFARI_MAC }), undefined);
});

test("Safari on a Mac is assumed to be Apple silicon", () => {
  const platform = detectPlatform({ userAgent: SAFARI_MAC });
  assert.deepEqual(platform, { os: "darwin", arch: "arm64", browser: undefined, archAssumed: true });
  assert.equal(recommendTarget(TARGETS, platform)?.arch, "arm64");
});

test("a reported architecture beats the assumption", () => {
  const platform = detectPlatform({ platform: "macOS", architecture: "x86", bitness: "64" });
  assert.deepEqual(platform, { os: "darwin", arch: "x86_64", browser: undefined, archAssumed: false });
  assert.deepEqual(recommendTarget(TARGETS, platform), target("darwin", "x86_64"));
});

test("the recommendation prefers its own OS, then a fitting architecture", () => {
  assert.deepEqual(
    recommendTarget(TARGETS, detectPlatform({ userAgent: FIREFOX_LINUX })),
    target("linux", "noarch", true)
  );
  assert.deepEqual(recommendTarget(TARGETS, detectPlatform({ platform: "Windows" })), target("win32", "x86_64", true));
  assert.deepEqual(recommendTarget(TARGETS, detectPlatform({ userAgent: SAFARI_IPAD })), target("web", "noarch", true));
});

test("no target for this OS, or no OS at all, leaves the server's choice alone", () => {
  assert.equal(recommendTarget(TARGETS, detectPlatform({ userAgent: CHROME_ANDROID })), undefined);
  assert.equal(recommendTarget(TARGETS, detectPlatform({})), undefined);
});

test("an architecture nobody ships falls back to the OS recommendation", () => {
  const only = [target("win32", "arm64"), target("win32", "x86_64", true)];
  assert.deepEqual(
    recommendTarget(only, { os: "win32", arch: undefined, browser: undefined, archAssumed: true }),
    target("win32", "x86_64", true)
  );
});

const CHROME_LINUX =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const EDGE_WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0";

test("the browser is Firefox, a Chromium family member, or unknown", () => {
  assert.equal(detectBrowser({ userAgent: FIREFOX_LINUX }), "firefox");
  assert.equal(detectBrowser({ userAgent: CHROME_LINUX }), "chromium");
  assert.equal(detectBrowser({ userAgent: EDGE_WINDOWS }), "chromium");
  assert.equal(detectBrowser({ userAgent: "", brands: ["Not A;Brand", "Chromium", "Brave"] }), "chromium");
  assert.equal(detectBrowser({ userAgent: SAFARI_MAC }), undefined);
  assert.equal(detectBrowser({}), undefined);
});

const EXTENSIONS: TargetChoice[] = [
  { ...target("firefox", "noarch"), available: false },
  target("firefox", "noarch", true),
  { ...target("chromium", "noarch"), available: false },
  target("chromium", "noarch", true),
];

test("a list of extensions is matched by browser, never by OS, and skips what is not available", () => {
  assert.equal(recommendTarget(EXTENSIONS, detectPlatform({ userAgent: FIREFOX_LINUX })), EXTENSIONS[1]);
  assert.equal(recommendTarget(EXTENSIONS, detectPlatform({ userAgent: EDGE_WINDOWS })), EXTENSIONS[3]);
  assert.equal(recommendTarget(EXTENSIONS, detectPlatform({ userAgent: SAFARI_MAC })), undefined);
});

test("picking a tab acts as if the visitor used that browser or OS", () => {
  const safari = detectPlatform({ userAgent: SAFARI_MAC });
  assert.equal(recommendTarget(EXTENSIONS, inGroup(safari, "firefox")), EXTENSIONS[1]);
  assert.equal(recommendTarget(TARGETS, inGroup(safari, "win32")), TARGETS[4]);
});
