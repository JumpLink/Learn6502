import { donationsAllowed, purchased } from "@gjsify/distribution";
import { editionBadgeService, type EditionBadgeId } from "@learn6502/common-ui";

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
  /**
   * Link to the landing page's support section; labelled "Support", never "Donate" (business income, no
   * deduction). `null` on a channel that shows no donation UI at all (the Microsoft and Apple stores).
   */
  supportLink: { title: string; url: string } | null;
}

/** One edition badge: the short name and the sentence that says what it means. */
export interface EditionBadge {
  id: EditionBadgeId;
  title: string;
  detail: string;
}

/**
 * The comments label of `Adw.AboutDialog` is `use-markup=True`, so a stray `&` in a translation
 * would blank the whole label. Pango only knows the five XML predefined entities; escaping the
 * three that open markup is enough, and leaves the text readable where no markup is parsed at all.
 */
const escapeMarkup = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * The badges this build shows, in display order. Which ones exist is decided by
 * `EditionBadgeService` from the `purchased` capability of the distribution channel — never from
 * the channel name, and never from anything the user could set.
 */
export function editionBadges(): EditionBadge[] {
  const badges: Record<EditionBadgeId, EditionBadge> = {
    "open-source": {
      id: "open-source",
      // TRANSLATORS: Badge in the About dialog, shown by every build of the app
      title: _("Open Source"),
      // TRANSLATORS: What the "Open Source" badge in the About dialog means
      detail: _("Thank you for using open source software."),
    },
    purchased: {
      id: "purchased",
      // TRANSLATORS: Badge in the About dialog, shown only in builds bought from an app store
      title: _("Supporter"),
      // TRANSLATORS: What the "Supporter" badge in the About dialog means
      detail: _("You supported this open source project by buying the app. Thank you!"),
    },
  };
  return editionBadgeService.badges(purchased()).map((id) => badges[id]);
}

/** The badges as one Pango markup block, each on its own line. */
export function editionNotice(): string {
  return editionBadges()
    .map((badge) => `<b>${escapeMarkup(badge.title)}</b> · ${escapeMarkup(badge.detail)}`)
    .join("\n");
}

/**
 * The About dialog's comments with the badges above them.
 *
 * The main page of `Adw.AboutDialog` is a sealed template — `add_link()` and `comments` both land
 * on the Details page, and the only main-page hook is `add_other_app()`, which means something
 * else. So the badges ride at the top of the comments, where libadwaita already renders app prose.
 */
export function commentsWithEdition(comments: string): string {
  const notice = editionNotice();
  return comments ? `${notice}\n\n${comments}` : notice;
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
    applicationName: _("Learn 6502 Assembly"),
    applicationIcon: "eu.jumplink.Learn6502",
    developerName: "Pascal Garber",
    comments: _("Program vintage consoles"),
    website: "https://flathub.org/apps/eu.jumplink.Learn6502",
    issueUrl: "https://github.com/JumpLink/Learn6502/issues",
    license: "GPL-3.0-or-later",
    supportLink: donationsAllowed() ? { title: _("Support"), url: supportUrl() } : null,
  };
}
