import type {
  DownloadTarget,
  ReleaseAsset,
  SiteDownloadConfig,
  TargetArch,
  TargetFormat,
  TargetPlatform,
} from "./types.ts";

/** Browser extensions are listed after the OS builds; a page usually has only one kind. */
export const PLATFORM_ORDER: readonly TargetPlatform[] = [
  "linux",
  "darwin",
  "win32",
  "android",
  "web",
  "firefox",
  "chromium",
];

/** Platforms that are browsers: their targets are picked by the visitor's browser, not OS. */
export function isBrowserPlatform(platform: TargetPlatform): platform is "firefox" | "chromium" {
  return platform === "firefox" || platform === "chromium";
}

/** Best format first, per OS. The first target in this order is the recommended one. */
const FORMAT_RANK: Record<TargetPlatform, readonly TargetFormat[]> = {
  linux: ["flathub", "appimage", "flatpak", "deb", "rpm"],
  darwin: ["dmg", "zip"],
  win32: ["msi", "zip"],
  android: ["apk"],
  web: ["web", "zip"],
  firefox: ["store", "xpi", "zip", "source"],
  chromium: ["store", "zip", "source"],
};

/** Apple silicon first on macOS, the common PC architecture first everywhere else. */
const ARCH_RANK: Record<TargetPlatform, readonly TargetArch[]> = {
  linux: ["noarch", "x86_64", "arm64"],
  darwin: ["arm64", "x86_64", "noarch"],
  win32: ["x86_64", "arm64", "noarch"],
  android: ["noarch", "arm64", "x86_64"],
  web: ["noarch", "x86_64", "arm64"],
  firefox: ["noarch"],
  chromium: ["noarch"],
};

export const DOWNLOAD_LABELS: Record<string, string> = {
  "linux:flathub": "Flathub",
  "linux:flatpak": "Flatpak bundle",
  "linux:appimage": "AppImage",
  "linux:deb": "Debian package",
  "linux:rpm": "RPM package",
  "win32:msi": "Windows installer",
  "win32:zip": "Windows portable",
  "darwin:zip": "macOS app",
  "darwin:dmg": "macOS disk image",
  "android:apk": "Android package",
  "web:web": "Try in browser",
  "web:zip": "Web build",
  "firefox:store": "Firefox Add-ons",
  "firefox:xpi": "Signed Firefox add-on",
  "firefox:zip": "Firefox extension",
  "firefox:source": "Build from source",
  "chromium:store": "Chrome Web Store",
  "chromium:zip": "Chromium extension",
  "chromium:source": "Build from source",
};

function detectArch(name: string): TargetArch {
  if (/arm64|aarch64/i.test(name)) return "arm64";
  if (/x86_64|x64|amd64/i.test(name)) return "x86_64";
  return "noarch";
}

/** Maps a release asset to the OS and format it serves, or `null` for files that are not downloads (checksums, sources). */
export function classifyAsset(
  asset: ReleaseAsset
): { os: TargetPlatform; format: TargetFormat; arch: TargetArch } | null {
  const name = asset.name.toLowerCase();
  const arch = detectArch(name);
  if (name.endsWith(".flatpak")) return { os: "linux", format: "flatpak", arch };
  if (name.endsWith(".appimage")) return { os: "linux", format: "appimage", arch };
  if (name.endsWith(".deb")) return { os: "linux", format: "deb", arch };
  if (name.endsWith(".rpm")) return { os: "linux", format: "rpm", arch };
  if (name.endsWith(".msi")) return { os: "win32", format: "msi", arch };
  if (name.endsWith(".dmg")) return { os: "darwin", format: "dmg", arch };
  if (name.endsWith(".apk")) return { os: "android", format: "apk", arch };
  if (name.endsWith(".xpi")) return { os: "firefox", format: "xpi", arch: "noarch" };
  if (name.endsWith(".zip")) {
    if (/windows|win32|win64/.test(name)) return { os: "win32", format: "zip", arch };
    if (/macos|darwin/.test(name)) return { os: "darwin", format: "zip", arch };
    if (/web/.test(name)) return { os: "web", format: "zip", arch };
    if (/firefox/.test(name)) return { os: "firefox", format: "zip", arch: "noarch" };
    if (/chrome|chromium|edge/.test(name)) return { os: "chromium", format: "zip", arch: "noarch" };
  }
  return null;
}

function label(os: TargetPlatform, format: TargetFormat): string {
  return DOWNLOAD_LABELS[`${os}:${format}`] ?? format;
}

function rank<T>(order: readonly T[], value: T): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

export interface DownloadSources {
  assets: readonly ReleaseAsset[];
  /** Flathub application id, when the app is published there. */
  flathub?: string;
  /** Bytes the Flathub install transfers, from its summary endpoint. */
  flathubSize?: number;
  /** Root-relative URL of the live web build. */
  webAppUrl?: string;
  /** `gjsify.site.downloads`: targets no release asset supplies, e.g. a store page. */
  configured?: readonly SiteDownloadConfig[];
}

/**
 * What the store install costs to download. Flathub's own number is the honest one; the Flatpak
 * bundle of the same release is close enough to stand in when the API did not answer.
 */
function storeSize(sources: DownloadSources): number | undefined {
  if (sources.flathubSize !== undefined) return sources.flathubSize;
  const bundle = sources.assets.find((asset) => classifyAsset(asset)?.format === "flatpak");
  return bundle?.size;
}

/** Builds the sorted target list and marks the first available target of every platform as recommended. */
export function buildDownloadTargets(sources: DownloadSources): DownloadTarget[] {
  const targets: DownloadTarget[] = [];

  if (sources.flathub) {
    targets.push({
      os: "linux",
      arch: "noarch",
      format: "flathub",
      label: label("linux", "flathub"),
      url: `https://flathub.org/apps/${sources.flathub}`,
      available: true,
      size: storeSize(sources),
      recommended: false,
    });
  }

  for (const asset of sources.assets) {
    const kind = classifyAsset(asset);
    if (!kind) continue;
    targets.push({
      ...kind,
      label: label(kind.os, kind.format),
      url: asset.downloadUrl,
      available: true,
      size: asset.size,
      downloadCount: asset.downloadCount,
      recommended: false,
    });
  }

  if (sources.webAppUrl) {
    targets.push({
      os: "web",
      arch: "noarch",
      format: "web",
      label: label("web", "web"),
      url: sources.webAppUrl,
      available: true,
      recommended: false,
    });
  }

  for (const entry of sources.configured ?? []) {
    targets.push({
      os: entry.platform,
      arch: "noarch",
      format: entry.format,
      label: entry.label ?? label(entry.platform, entry.format),
      url: entry.available ? (entry.url ?? "") : "",
      available: entry.available,
      recommended: false,
    });
  }

  targets.sort(
    (a, b) =>
      rank(PLATFORM_ORDER, a.os) - rank(PLATFORM_ORDER, b.os) ||
      rank(FORMAT_RANK[a.os], a.format) - rank(FORMAT_RANK[b.os], b.format) ||
      rank(ARCH_RANK[a.os], a.arch) - rank(ARCH_RANK[b.os], b.arch)
  );

  const seen = new Set<TargetPlatform>();
  for (const target of targets) {
    if (!target.available || seen.has(target.os)) continue;
    seen.add(target.os);
    target.recommended = true;
  }
  return targets;
}
