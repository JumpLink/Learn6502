import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import Gtk from "@girs/gtk-4.0";

import { addAboutExtras, commentsWithEdition, editionBadges } from "@learn6502/ui";

import { APPLICATION_ID, RESOURCES_PATH, PACKAGE_VERSION } from "./constants.ts";
import { parseAppdata } from "./appdata.ts";

const APPDATA_RESOURCE = `${RESOURCES_PATH}/metainfo/${APPLICATION_ID}.metainfo.xml`;

/**
 * SPDX identifiers libadwaita renders as a known licence. Anything else is
 * shown as custom text, which is what `Gtk.License.CUSTOM` is for.
 */
const LICENSES: Record<string, Gtk.License> = {
  "GPL-2.0-or-later": Gtk.License.GPL_2_0,
  "GPL-3.0-or-later": Gtk.License.GPL_3_0,
  "GPL-3.0-only": Gtk.License.GPL_3_0_ONLY,
  "LGPL-2.1-or-later": Gtk.License.LGPL_2_1,
  "LGPL-3.0-or-later": Gtk.License.LGPL_3_0,
  MIT: Gtk.License.MIT_X11,
  "Apache-2.0": Gtk.License.APACHE_2_0,
};

const readAppdata = (): string | null => {
  try {
    const bytes = Gio.resources_lookup_data(APPDATA_RESOURCE, Gio.ResourceLookupFlags.NONE);
    return new TextDecoder().decode(bytes.toArray());
  } catch (error) {
    console.warn(`Could not read ${APPDATA_RESOURCE}:`, error);
    return null;
  }
};

/**
 * Build the About dialog without `Adw.AboutDialog.new_from_appdata()`.
 *
 * Not a style choice — on Windows that constructor does not exist. gvsbuild
 * builds libadwaita with `0001-remove-appstream-dependency.patch`, which wraps
 * the four `*_from_appdata` entry points in `#ifndef G_OS_WIN32` so a Windows
 * build need not drag in the whole AppStream library. Calling it there throws
 * and the dialog never opens.
 *
 * fixed upstream in gjsify: gjsify/gjsify#1662 records the gap with a check
 * that goes red once libadwaita >= 1.10 (ministream) lets gvsbuild drop the
 * patch — delete this fallback when that check fires.
 */
const buildFromAppdata = (): Adw.AboutDialog => {
  const dialog = new Adw.AboutDialog();
  dialog.applicationIcon = APPLICATION_ID;
  dialog.version = PACKAGE_VERSION;

  const xml = readAppdata();
  if (!xml) return dialog;

  const fields = parseAppdata(xml, GLib.get_language_names());
  if (fields.applicationName) dialog.applicationName = fields.applicationName;
  if (fields.developerName) dialog.developerName = fields.developerName;
  if (fields.website) dialog.website = fields.website;
  if (fields.issueUrl) dialog.issueUrl = fields.issueUrl;
  if (fields.supportUrl) dialog.supportUrl = fields.supportUrl;

  if (fields.license) {
    const known = LICENSES[fields.license];
    if (known !== undefined) {
      dialog.licenseType = known;
    } else {
      dialog.licenseType = Gtk.License.CUSTOM;
      dialog.license = fields.license;
    }
  }

  return dialog;
};

/** The first descendant carrying `cssClass`, depth first — null if the tree has none. */
const findByCssClass = (widget: Gtk.Widget, cssClass: string): Gtk.Widget | null => {
  for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
    if (child.has_css_class(cssClass)) return child;
    const found = findByCssClass(child, cssClass);
    if (found) return found;
  }
  return null;
};

/** One badge: the name as a pill, the sentence that explains it underneath. */
const buildEditionBadges = (): Gtk.Box => {
  const box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 12, marginTop: 6 });
  for (const badge of editionBadges()) {
    const group = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, spacing: 3 });
    const pill = new Gtk.Label({ label: badge.title, halign: Gtk.Align.CENTER });
    pill.add_css_class("edition-badge");
    const detail = new Gtk.Label({
      label: badge.detail,
      halign: Gtk.Align.CENTER,
      justify: Gtk.Justification.CENTER,
      wrap: true,
      maxWidthChars: 30,
    });
    detail.add_css_class("caption");
    detail.add_css_class("dim-label");
    group.append(pill);
    group.append(detail);
    box.append(group);
  }
  return box;
};

/**
 * Put the badges on the About dialog's main page, under the version pill.
 *
 * `Adw.AboutDialog` has no API for this: `comments` and `add_link()` both land on the Details
 * subpage, and `add_other_app()` means a different thing entirely. A badge nobody sees without
 * first clicking "Details" is not a badge, so the version pill is looked up in libadwaita's
 * template and the badges are inserted after it. Should that template ever change, nothing is
 * found and the caller falls back to the comments, where the same text stays readable.
 */
const addEditionBadges = (dialog: Adw.AboutDialog): boolean => {
  const version = findByCssClass(dialog, "app-version");
  const page = version?.get_parent();
  if (!version || !(page instanceof Gtk.Box)) return false;
  page.insert_child_after(buildEditionBadges(), version);
  return true;
};

/**
 * Prefer the upstream constructor — it also reads the release notes, which the
 * fallback deliberately does not.
 */
export const createAboutDialog = (): Adw.AboutDialog => {
  const dialog = createFromAppdata();
  addAboutExtras(dialog);
  // An Adw.Dialog has no widget tree at all until it is mapped — `get_first_child()` answers null
  // here — so the badges go in on the first map, when the template's pages actually exist.
  const mapped = dialog.connect("map", () => {
    dialog.disconnect(mapped);
    if (!addEditionBadges(dialog)) dialog.comments = commentsWithEdition(dialog.comments ?? "");
  });
  return dialog;
};

const createFromAppdata = (): Adw.AboutDialog => {
  try {
    return Adw.AboutDialog.new_from_appdata(APPDATA_RESOURCE, PACKAGE_VERSION) as Adw.AboutDialog;
  } catch (error) {
    // console.log, not console.debug: GJS drops the debug level even under
    // G_MESSAGES_DEBUG=all, so the one line explaining a sparser About dialog
    // would never reach whoever is reading the log.
    console.log(
      `Adw.AboutDialog.new_from_appdata is unavailable on this platform (${error}); ` +
        "building the About dialog from AppStream metadata directly."
    );
    return buildFromAppdata();
  }
};
