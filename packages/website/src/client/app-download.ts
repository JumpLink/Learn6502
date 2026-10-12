import { enhanceDialog } from "./dialog.ts";
import { detectPlatform, recommendTarget, type Platform, type PlatformHints } from "./platform.ts";
import type { TargetArch, TargetOs } from "../site-data/types.ts";

/** The parts of `navigator.userAgentData` this page uses; it is absent outside Chromium. */
interface UserAgentData {
  platform?: string;
  getHighEntropyValues?(hints: string[]): Promise<{ architecture?: string; bitness?: string }>;
}

/** One rendered download row. Everything here was translated at build time. */
interface Row {
  os: TargetOs;
  arch: TargetArch;
  recommended: boolean;
  url: string;
  cta: string;
  size: string;
}

async function readHints(): Promise<PlatformHints> {
  const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
  const hints: PlatformHints = { platform: data?.platform, userAgent: navigator.userAgent };
  if (data?.getHighEntropyValues) {
    try {
      const high = await data.getHighEntropyValues(["architecture", "bitness"]);
      hints.architecture = high.architecture;
      hints.bitness = high.bitness;
    } catch {
      // The browser may refuse; `detectPlatform` then falls back to an assumed architecture.
    }
  }
  return hints;
}

function readRows(host: HTMLElement): Row[] {
  return [...host.querySelectorAll<HTMLElement>("li.target")].flatMap((item) => {
    const link = item.querySelector("a");
    const os = item.dataset.os as TargetOs | undefined;
    const arch = item.dataset.arch as TargetArch | undefined;
    if (!link || !os || !arch) return [];
    return [
      {
        os,
        arch,
        recommended: item.dataset.recommended !== undefined,
        url: link.href,
        cta: item.dataset.cta ?? link.textContent?.trim() ?? "",
        size: item.dataset.size ?? "",
      },
    ];
  });
}

/**
 * Enhances the server-rendered download widget: the list of targets becomes a modal with one tab
 * per operating system, and the primary button is swapped for the build that fits this machine.
 * Nothing here invents a label — every string was rendered into a data attribute at build time.
 */
class AppDownload extends HTMLElement {
  connectedCallback(): void {
    const dialog = this.querySelector("dialog");
    const cta = this.querySelector<HTMLAnchorElement>("a.download-cta");
    if (!dialog || !cta) return;
    this.dataset.enhanced = "true";
    enhanceDialog(dialog, this.querySelector(".download-toggle"));

    const rows = readRows(this);
    const groups = [...this.querySelectorAll<HTMLElement>(".os-group")];
    const tabs = [...this.querySelectorAll<HTMLButtonElement>(".os-tab")];
    const tabBar = this.querySelector<HTMLElement>(".os-tabs");
    const grouped = tabs.length > 1;
    if (tabBar && grouped) tabBar.hidden = false;

    let platform: Platform = { os: undefined, arch: undefined, archAssumed: true };

    const show = (os: TargetOs): void => {
      for (const group of groups) group.hidden = grouped && group.dataset.os !== os;
      for (const tab of tabs) {
        const selected = tab.dataset.os === os;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      }
    };

    const offer = (row: Row): void => {
      cta.href = row.url;
      cta.dataset.os = row.os;
      cta.dataset.arch = row.arch;
      const label = cta.querySelector(".download-label");
      if (label) label.textContent = row.cta;
      // The size badge belongs to the same fact row as the button, one level up in the hero.
      const badge = document.querySelector<HTMLElement>(".badge-size");
      const value = badge?.querySelector(".badge-value");
      if (badge && value) {
        value.textContent = row.size;
        badge.hidden = row.size === "";
        const facts = badge.closest<HTMLElement>(".badges");
        // Showing or hiding a fact changes how many columns the row needs.
        if (facts) {
          const count = [...facts.children].filter((item) => !(item as HTMLElement).hidden).length;
          facts.style.setProperty("--badge-count", String(count));
          facts.toggleAttribute("data-odd", count % 2 === 1);
        }
      }
    };

    const select = (os: TargetOs): void => {
      show(os);
      const row = recommendTarget(rows, { ...platform, os });
      if (row) offer(row);
    };

    const preselected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.os as
      | TargetOs
      | undefined;
    if (preselected) show(preselected);

    for (const tab of tabs) {
      tab.addEventListener("click", () => {
        const os = tab.dataset.os as TargetOs | undefined;
        if (os) select(os);
      });
    }

    tabBar?.addEventListener("keydown", (event) => {
      const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
      if (current === -1) return;
      const step = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const tab = tabs[(step + tabs.length) % tabs.length];
      tab?.focus();
      tab?.click();
    });

    void readHints().then((hints) => {
      platform = detectPlatform(hints);
      const row = platform.os ? recommendTarget(rows, platform) : undefined;
      // Nothing matched, or nothing is built for this platform: the server's choice stands.
      if (!row) return;
      show(row.os);
      offer(row);
    });
  }
}

customElements.define("app-download", AppDownload);
