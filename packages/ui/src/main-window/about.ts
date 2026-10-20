import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { donationsAllowed } from "@gjsify/distribution";

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
  licenseType: Gtk.License;
  /**
   * Link to the landing page's support section; labelled "Support", never "Donate" (business income, no
   * deduction). `null` on a channel that shows no donation UI at all (the Microsoft and Apple stores).
   */
  supportLink: { title: string; url: string } | null;
}

/** English page; the metainfo `<url type="donation">` points at it. */
const SUPPORT_URL = "https://jumplink.eu/Learn6502/en/support/";

/** The site renders `en` and `de`; anything else falls back to English. */
export function supportUrl(): string {
  const locale = new Intl.DateTimeFormat().resolvedOptions().locale;
  return locale.startsWith("de") ? SUPPORT_URL.replace("/en/", "/de/") : SUPPORT_URL;
}

export function getAboutInfo(): AboutInfo {
  return {
    applicationName: _("Learn 6502"),
    applicationIcon: "eu.jumplink.Learn6502",
    developerName: "Pascal Garber",
    comments: _("Program vintage consoles"),
    website: "https://flathub.org/apps/eu.jumplink.Learn6502",
    issueUrl: "https://github.com/JumpLink/Learn6502/issues",
    licenseType: Gtk.License.GPL_3_0,
    supportLink: donationsAllowed() ? { title: _("Support"), url: supportUrl() } : null,
  };
}

/**
 * What `Adw.AboutDialog.new_from_appdata()` does not map: the translator credits and the support
 * link (`<url type="donation">` is not read).
 */
export function addAboutExtras(dialog: Adw.AboutDialog): void {
  // TRANSLATORS: Replace with your names, one per line, e.g. "Jane Doe <jane@example.com>"
  dialog.translatorCredits = _("translator-credits");
  const link = getAboutInfo().supportLink;
  if (link) dialog.add_link(link.title, link.url);
}

/** The About dialog where the metainfo cannot be read: the same fields, from {@link getAboutInfo}. */
export function createAboutDialog(version: string): Adw.AboutDialog {
  const info = getAboutInfo();
  const dialog = new Adw.AboutDialog();
  dialog.applicationName = info.applicationName;
  dialog.applicationIcon = info.applicationIcon;
  dialog.version = version;
  dialog.developerName = info.developerName;
  dialog.comments = info.comments;
  dialog.website = info.website;
  dialog.issueUrl = info.issueUrl;
  dialog.licenseType = info.licenseType;
  addAboutExtras(dialog);
  return dialog;
}
