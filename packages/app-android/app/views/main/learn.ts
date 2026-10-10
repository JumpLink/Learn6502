import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { ScrollView, StackLayout } from "@nativescript/core";
import { Adw, Gtk, NOTIFY_VISIBLE_PAGE, padForSystemInsets } from "@gjsify/adwaita-nativescript";
import { goNextSymbolic } from "@gjsify/adwaita-icons/actions";
import { schoolSymbolic, openBookSymbolic, codeSymbolic } from "~/icons";
import { localize as _ } from "@nativescript/localize";
import type { LearnView, SourceViewCopyEvent } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";
import { EventDispatcher } from "@learn6502/core";
import { TutorialView } from "~/mdx/tutorial-view";
import { ExamplesList } from "~/widgets/examples-list";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";

/**
 * Learn's own navigation state (mirrors app-gnome's GObject
 * `notify::hasVisibleSubpage` and app-web's `subpage-changed` CustomEvent) — not
 * part of the shared `LearnView` interface, since it is UI-shell plumbing rather
 * than 6502 domain state.
 */
interface LearnNavigationEventMap {
  "subpage-changed": { hasSubpage: boolean };
}

/**
 * Learn view — implements LearnView. Now a scrollable content view (the MDX
 * TutorialView) added to the shell's Adw.ViewStack. Copy-to-editor events are still
 * routed through learnController.
 */
class Learn implements LearnView {
  readonly events = new EventDispatcher<LearnNavigationEventMap>();

  private nav: Adw.NavigationView | null = null;
  /** What scrolls on the Tutorial and Examples pages: the part that must clear the gesture area. */
  private scrollContents: View[] = [];
  private releaseInsets: (() => void)[] = [];
  private log = logger.scoped("Learn");

  /** Build the Learn navigation (mirrors the GNOME Adw.NavigationView): a main
   *  page with a boxed-list of Tutorial / Examples rows that push to subpages.
   *  Wires the tutorial copy events (once). */
  build(): View {
    const nav = new Adw.NavigationView();
    this.nav = nav;
    // Drives the shell's header back button (see main.ts), the same seam the
    // GNOME twin's `notify::visible-page` and the web twin's `subpage-changed`
    // event fill.
    nav.addEventListener(NOTIFY_VISIBLE_PAGE, () => {
      this.events.dispatch("subpage-changed", { hasSubpage: this.hasVisibleSubpage });
    });

    // --- Tutorial page: the MDX TutorialView ---
    // The two subpages hold about 750 native views between them (the tutorial's HTML blocks and
    // its 33 source views, the example cards): building them with the window cost ~4 s of a cold
    // start on a Galaxy S9, for pages nobody has opened yet. Each is built on its first push.
    const tutorialColumn = new StackLayout();
    const tutorialScroll = new ScrollView();
    tutorialScroll.content = tutorialColumn;

    // --- Examples page: the GNOME app's ExamplesList, a card per example (title, author,
    //     description, thumbnail, code preview with its copy button). Copying loads the example
    //     into the editor + switches to the Code view, the same path the tutorial's copy
    //     buttons use. ---
    // A status page handed to the scroll view directly is measured at the viewport's height, which
    // clips a list taller than it (the cards of the examples) and leaves nothing to scroll; in a
    // vertical stack it is measured at its own.
    const examplesColumn = new StackLayout();
    const examplesScroll = new ScrollView();
    examplesScroll.content = examplesColumn;
    this.scrollContents = [tutorialColumn, examplesColumn];

    const buildTutorial = () => {
      if (tutorialColumn.getChildrenCount() > 0) return;
      const tutorialView = new TutorialView();
      tutorialView.className = "mx-4";
      tutorialView.events.on("copy", (event: SourceViewCopyEvent) => {
        learnController.dispatch("copy", { code: event.code });
      });
      tutorialColumn.addChild(tutorialView);
    };

    const buildExamples = () => {
      if (examplesColumn.getChildrenCount() > 0) return;
      const examplesList = new ExamplesList();
      examplesList.onCopy = (code) => learnController.dispatch("copy", { code });
      const examplesClamp = new Adw.Clamp();
      examplesClamp.maximumSize = 600;
      examplesClamp.set_child(asView(examplesList));

      const examples = new Adw.StatusPage();
      examples.iconName = codeSymbolic;
      examples.title = _("Examples");
      examples.description = _("Try out example programs for the 6502 microprocessor.");
      examples.set_child(asView(examplesClamp));
      examplesColumn.addChild(asView(examples));
    };

    // --- Main page: an Adw.StatusPage hero (icon + title + description) over a
    //     boxed list of Tutorial + Examples rows, matching the GNOME learn.blp. ---
    const group = new Adw.PreferencesGroup();
    group.add(
      this.navRow(_("Tutorial"), _("Step-by-step guide to 6502 assembly"), openBookSymbolic, () => {
        buildTutorial();
        nav.push("tutorial");
      })
    );
    group.add(
      this.navRow(_("Examples"), _("Try out example programs"), codeSymbolic, () => {
        buildExamples();
        nav.push("examples");
      })
    );
    const mainClamp = new Adw.Clamp();
    mainClamp.maximumSize = 600;
    mainClamp.set_child(group);

    const mainPage = new Adw.StatusPage();
    mainPage.iconName = schoolSymbolic;
    mainPage.title = _("Learn");
    mainPage.description = _("Learn how to program the 6502 microprocessor.");
    mainPage.set_child(asView(mainClamp));

    nav.add(mainPage, "main");
    nav.add(tutorialScroll, "tutorial");
    nav.add(examplesScroll, "examples");
    return asView(nav);
  }

  /** Whether a subpage (Tutorial/Examples) is open — drives the shell's header
   *  back button (mirrors the GNOME/Web twins' `hasVisibleSubpage`). */
  get hasVisibleSubpage(): boolean {
    const tag = this.nav?.visiblePageTag ?? null;
    return tag !== null && tag !== "main";
  }

  /** Pop the navigation stack one level. Returns true if a page was popped
   *  (i.e. we were on a subpage) so the caller can consume the back press. */
  navigateBack(): boolean {
    return this.nav?.pop() ?? false;
  }

  /** An activatable boxed-list row: a leading symbolic icon, title + subtitle,
   *  and a trailing go-next chevron (matches the GNOME Adw.ActionRow). */
  private navRow(title: string, subtitle: string, iconSvg: string, onTap: () => void): Adw.ActionRow {
    const row = new Adw.ActionRow();
    row.title = title;
    row.subtitle = subtitle;
    const prefix = new Gtk.Image();
    prefix.iconName = iconSvg;
    row.add_prefix(prefix);
    const chevron = new Gtk.Image();
    chevron.iconName = goNextSymbolic;
    row.add_suffix(chevron);
    row.addEventListener("tap", onTap);
    return row;
  }

  /** Whether the pages reach the screen's bottom edge (the wide layout): their scrolling content
   *  then ends a gesture area higher, while the page background runs on to the edge. */
  padSystemInsets(on: boolean): void {
    for (const release of this.releaseInsets) release();
    this.releaseInsets = on ? this.scrollContents.map((view) => padForSystemInsets(view)) : [];
  }

  // --- LearnView interface ---
  saveScrollPosition(): void {
    this.log.debug("saveScrollPosition() - placeholder");
  }

  restoreScrollPosition(): void {
    this.log.debug("restoreScrollPosition() - placeholder");
  }
}

const learnView = new Learn();

/** Build the learn screen for the shell's Adw.ViewStack. */
export function buildLearnScreen(): ScreenModule {
  return {
    view: learnView.build(),
    onHide: () => learnView.saveScrollPosition(),
    onBack: () => learnView.navigateBack(),
    padSystemInsets: (on) => learnView.padSystemInsets(on),
  };
}

export { learnView };
