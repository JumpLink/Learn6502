import Gdk from "@girs/gdk-4.0";
import GLib from "@girs/glib-2.0";
import Graphene from "@girs/graphene-1.0";
import Gtk from "@girs/gtk-4.0";
import { donationsAllowed } from "@gjsify/distribution";
import { learnController } from "../controller/index.ts";
import { supportPromptService } from "../services/index.ts";
import type { SupportPromptStore } from "../services/index.ts";

import { notificationService } from "../notification.service.ts";
import { settings } from "../settings.ts";
import { _ } from "../translate.ts";
import { supportUrl } from "./about.ts";

const SETTINGS_KEY = "support-prompt-years";
const FIRST_CHAPTER = "introduction";
/** The next chapter's heading counts as reached once it scrolls into the upper part of the page. */
const REACHED_FRACTION = 0.5;
const TOAST_TIMEOUT = 12;

const store: SupportPromptStore = {
  read: () => settings.get_value(SETTINGS_KEY).deepUnpack<number[]>(),
  write: (years) => settings.set_value(SETTINGS_KEY, new GLib.Variant("ai", years)),
};

function collectChapterHeadings(widget: Gtk.Widget, found: Gtk.Label[] = []): Gtk.Label[] {
  for (let child = widget.get_first_child(); child; child = child.get_next_sibling()) {
    if (child instanceof Gtk.Label && child.has_css_class("title-2")) found.push(child);
    collectChapterHeadings(child, found);
  }
  return found;
}

/**
 * The tutorial is one scrolling page of MDX, so "first chapter done" means the learner has scrolled
 * on to the heading of the second chapter.
 */
function reachedSecondChapter(scroll: Gtk.ScrolledWindow, headings: Gtk.Label[]): boolean {
  const next = headings[1];
  if (!next) return false;
  const [ok, point] = next.compute_point(scroll, Graphene.Point.zero());
  return ok && point.y < scroll.get_height() * REACHED_FRACTION;
}

/** Show the support toast, unless the channel forbids it or this year already had one. */
export function promptSupport(scroll: Gtk.Widget): void {
  if (!supportPromptService.claim(store, donationsAllowed(), new Date().getFullYear())) return;
  notificationService.showNotification({
    // TRANSLATORS: Toast shown once a year after the learner finishes the first tutorial chapter
    title: _("Great start — you finished the first chapter!"),
    timeout: TOAST_TIMEOUT,
    action: {
      label: _("Support"),
      callback: () => {
        const root = scroll.get_root();
        if (root instanceof Gtk.Window) Gtk.show_uri(root, supportUrl(), Gdk.CURRENT_TIME);
      },
    },
  });
}

/** Watch the tutorial's scroller and show the support prompt once, when the first chapter is finished. */
export function watchFirstChapter(scroll: Gtk.ScrolledWindow): void {
  if (!donationsAllowed()) return;
  const adjustment = scroll.get_vadjustment();
  let headings: Gtk.Label[] = [];
  const id = adjustment.connect("value-changed", () => {
    if (headings.length < 2) headings = collectChapterHeadings(scroll);
    if (!reachedSecondChapter(scroll, headings)) return;
    adjustment.disconnect(id);
    learnController.markSectionCompleted(FIRST_CHAPTER);
    promptSupport(scroll);
  });
}
