import type { DownloadTarget, ReleaseAsset, TargetArch, TargetFormat, TargetOs } from "./types.ts";

const OS_ORDER: readonly TargetOs[] = ["linux", "darwin", "win32", "android", "web"];

/** Best format first, per OS. The first target in this order is the recommended one. */
const FORMAT_RANK: Record<TargetOs, readonly TargetFormat[]> = {
  linux: ["flathub", "appimage", "flatpak", "deb", "rpm"],
  darwin: ["dmg", "zip"],
  win32: ["msi", "zip"],
  android: ["apk"],
  web: ["web", "zip"],
};

/** Apple silicon first on macOS, the common PC architecture first everywhere else. */
const ARCH_RANK: Record<TargetOs, readonly TargetArch[]> = {
  linux: ["noarch", "x86_64", "arm64"],
  darwin: ["arm64", "x86_64", "noarch"],
  win32: ["x86_64", "arm64", "noarch"],
  android: ["noarch", "arm64", "x86_64"],
  web: ["noarch", "x86_64", "arm64"],
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
};

function detectArch(name: string): TargetArch {
  if (/arm64|aarch64/i.test(name)) return "arm64";
  if (/x86_64|x64|amd64/i.test(name)) return "x86_64";
  return "noarch";
}

/** Maps a release asset to the OS and format it serves, or `null` for files that are not downloads (checksums, sources). */
export function classifyAsset(asset: ReleaseAsset): { os: TargetOs; format: TargetFormat; arch: TargetArch } | null {
  const name = asset.name.toLowerCase();
  const arch = detectArch(name);
  if (name.endsWith(".flatpak")) return { os: "linux", format: "flatpak", arch };
  if (name.endsWith(".appimage")) return { os: "linux", format: "appimage", arch };
  if (name.endsWith(".deb")) return { os: "linux", format: "deb", arch };
  if (name.endsWith(".rpm")) return { os: "linux", format: "rpm", arch };
  if (name.endsWith(".msi")) return { os: "win32", format: "msi", arch };
  if (name.endsWith(".dmg")) return { os: "darwin", format: "dmg", arch };
  if (name.endsWith(".apk")) return { os: "android", format: "apk", arch };
  if (name.endsWith(".zip")) {
    if (/windows|win32|win64/.test(name)) return { os: "win32", format: "zip", arch };
    if (/macos|darwin/.test(name)) return { os: "darwin", format: "zip", arch };
    if (/web/.test(name)) return { os: "web", format: "zip", arch };
  }
  return null;
}

function label(os: TargetOs, format: TargetFormat): string {
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
  /** Root-relative URL of the live web build. */
  webAppUrl?: string;
}

/** Builds the sorted target list and marks the first target of every OS as recommended. */
export function buildDownloadTargets(sources: DownloadSources): DownloadTarget[] {
  const targets: DownloadTarget[] = [];

  if (sources.flathub) {
    targets.push({
      os: "linux",
      arch: "noarch",
      format: "flathub",
      label: label("linux", "flathub"),
      url: `https://flathub.org/apps/${sources.flathub}`,
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
      recommended: false,
    });
  }

  targets.sort(
    (a, b) =>
      rank(OS_ORDER, a.os) - rank(OS_ORDER, b.os) ||
      rank(FORMAT_RANK[a.os], a.format) - rank(FORMAT_RANK[b.os], b.format) ||
      rank(ARCH_RANK[a.os], a.arch) - rank(ARCH_RANK[b.os], b.arch)
  );

  const seen = new Set<TargetOs>();
  for (const target of targets) {
    if (seen.has(target.os)) continue;
    seen.add(target.os);
    target.recommended = true;
  }
  return targets;
}
