import { _ } from "../translate.ts";

/**
 * What the About dialog shows where the platform cannot read the AppStream metainfo (Android, web).
 * Mirrors `data/metainfo/eu.jumplink.Learn6502.metainfo.xml.in`, which the GNOME app reads itself.
 */
export interface AboutInfo {
  applicationName: string;
  applicationIcon: string;
  developerName: string;
  comments: string;
  website: string;
  issueUrl: string;
  /** SPDX identifier */
  license: string;
  /** Link to the landing page's support section; labelled "Support", never "Donate" (business income, no deduction). */
  supportLink: { title: string; url: string };
}

/** English page; the metainfo `<url type="donation">` points at it. */
const SUPPORT_URL = "https://jumplink.eu/Learn6502/en/support/";

/** The site renders `en` and `de`; anything else falls back to English. */
function supportUrl(): string {
  const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.startsWith("de") ? SUPPORT_URL.replace("/en/", "/de/") : SUPPORT_URL;
}

export function getAboutInfo(): AboutInfo {
  return {
    applicationName: _("Learn 6502 Assembly"),
    applicationIcon: "eu.jumplink.Learn6502",
    developerName: "Pascal Garber",
    comments: _("Program vintage game consoles"),
    website: "https://flathub.org/apps/eu.jumplink.Learn6502",
    issueUrl: "https://github.com/JumpLink/Learn6502/issues",
    license: "GPL-3.0-or-later",
    supportLink: { title: _("Support"), url: supportUrl() },
  };
}
