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
  };
}
