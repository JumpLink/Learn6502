/**
 * Which build to offer first. The browser facts come in as plain values and the candidates as a
 * plain list, so the decision is a pure function and testable without a DOM — the component in
 * `app-download.ts` only reads `navigator` and the rendered markup and passes the result in.
 */
import type { TargetArch, TargetOs } from "../site-data/types.ts";

/** What a browser tells us about the machine, as far as this page uses it. */
export interface PlatformHints {
  /** `navigator.userAgentData.platform` — "Windows", "macOS", "Linux", "Android", "iOS", … */
  platform?: string;
  userAgent?: string;
  /** `architecture` from `getHighEntropyValues`: "x86", "arm". */
  architecture?: string;
  /** `bitness` from `getHighEntropyValues`: "64", "32". */
  bitness?: string;
}

export interface Platform {
  /** `undefined` when nothing matched: the page then keeps the server-rendered recommendation. */
  os: TargetOs | undefined;
  arch: TargetArch | undefined;
  /** True when `arch` is an assumption, because no browser API reported one. */
  archAssumed: boolean;
}

/** The architecture to assume when the browser reports none. Safari, notably, never does. */
const ASSUMED_ARCH: Record<TargetOs, TargetArch> = {
  linux: "x86_64",
  darwin: "arm64",
  win32: "x86_64",
  android: "arm64",
  web: "noarch",
};

/** iOS and iPadOS have no native build; the browser version is the one thing that runs there. */
export function detectOs(hints: PlatformHints): TargetOs | undefined {
  const text = `${hints.platform ?? ""} ${hints.userAgent ?? ""}`;
  if (/android/i.test(text)) return "android";
  if (/iphone|ipad|ipod|\bios\b/i.test(text)) return "web";
  if (/mac|darwin/i.test(text)) return "darwin";
  if (/win/i.test(text)) return "win32";
  if (/linux|x11|bsd|cros|chrome ?os/i.test(text)) return "linux";
  return undefined;
}

/** Only the two architectures the releases ship; anything else counts as unreported. */
export function detectArch(hints: PlatformHints): TargetArch | undefined {
  if (hints.architecture) {
    if (hints.bitness === "32") return undefined;
    if (/arm/i.test(hints.architecture)) return "arm64";
    if (/x86|amd/i.test(hints.architecture)) return "x86_64";
    return undefined;
  }
  const agent = hints.userAgent ?? "";
  if (/arm64|aarch64/i.test(agent)) return "arm64";
  if (/x86_64|x86-64|amd64|win64|wow64|\bx64\b/i.test(agent)) return "x86_64";
  return undefined;
}

export function detectPlatform(hints: PlatformHints): Platform {
  const os = detectOs(hints);
  const reported = detectArch(hints);
  return {
    os,
    arch: reported ?? (os ? ASSUMED_ARCH[os] : undefined),
    archAssumed: reported === undefined,
  };
}

/** The fields `recommendTarget` looks at; the rendered list carries them as data attributes. */
export interface TargetChoice {
  os: TargetOs;
  arch: TargetArch;
  recommended: boolean;
}

/**
 * The build to put on the primary button: the one its own OS recommends, preferring a file that
 * fits the architecture. `undefined` when nothing targets this OS at all.
 */
export function recommendTarget<T extends TargetChoice>(targets: readonly T[], platform: Platform): T | undefined {
  if (!platform.os) return undefined;
  const mine = targets.filter((target) => target.os === platform.os);
  const fits = (target: T) => target.arch === "noarch" || target.arch === platform.arch;
  return (
    mine.find((target) => target.recommended && fits(target)) ??
    mine.find(fits) ??
    mine.find((target) => target.recommended) ??
    mine[0]
  );
}
