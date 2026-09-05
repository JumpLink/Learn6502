import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { ScrollView } from "@nativescript/core";
import { Adw, Gtk } from "@gjsify/adwaita-nativescript";
import { goNextSymbolic } from "@gjsify/adwaita-icons/actions";
import { schoolSymbolic, openBookSymbolic, codeSymbolic } from "~/icons";
import { localize as _ } from "@nativescript/localize";
import type { LearnView, SourceViewCopyEvent } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";
import * as Examples from "@learn6502/examples/examples";
import type { ExampleMeta } from "@learn6502/examples";
import { TutorialView } from "~/mdx/tutorial-view";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";

/**
 * Learn view — implements LearnView. Now a scrollable content view (the MDX
 * TutorialView) added to the shell's Adw.ViewStack. Copy-to-editor events are still
 * routed through learnController.
 */
class Learn implements LearnView {
  private tutorialView: TutorialView | null = null;
  private nav: Adw.NavigationView | null = null;
  private _initialized = false;
  private log = logger.scoped("Learn");

  /** Build the Learn navigation (mirrors the GNOME Adw.NavigationView): a main
   *  page with a boxed-list of Tutorial / Examples rows that push to subpages.
   *  Wires the tutorial copy events (once). */
  build(): View {
    const tutorialView = new TutorialView();
    tutorialView.className = "mx-4";
    this.tutorialView = tutorialView;

    if (!this._initialized) {
      tutorialView.events.on("copy", (event: SourceViewCopyEvent) => {
        learnController.dispatch("copy", { code: event.code });
      });
      this._initialized = true;
    }

    const nav = new Adw.NavigationView();
    this.nav = nav;

    // --- Main page: an Adw.StatusPage hero (icon + title + description) over a
    //     boxed list of Tutorial + Examples rows, matching the GNOME learn.blp. ---
    const group = new Adw.PreferencesGroup();
    group.addRow(
      this.navRow(_("Tutorial"), _("Step-by-step guide to 6502 assembly"), openBookSymbolic, () => nav.push("tutorial"))
    );
    group.addRow(this.navRow(_("Examples"), _("Try out example programs"), codeSymbolic, () => nav.push("examples")));
    const mainClamp = new Adw.Clamp();
    mainClamp.maximumSize = 600;
    mainClamp.setChild(group);

    const mainPage = new Adw.StatusPage();
    mainPage.iconName = schoolSymbolic;
    mainPage.title = _("Learn");
    mainPage.description = _("Learn how to program the 6502 microprocessor.");
    mainPage.setChild(asView(mainClamp));

    // --- Tutorial page: the MDX TutorialView ---
    const tutorialScroll = new ScrollView();
    tutorialScroll.content = tutorialView;

    // --- Examples page: a boxed list of example programs (ports the GNOME
    //     ExamplesList). Tapping a row loads it into the editor + switches to the
    //     Code view, the same path the tutorial's copy buttons use. ---
    const examplesGroup = new Adw.PreferencesGroup();
    for (const example of Object.values(Examples) as ExampleMeta[]) {
      examplesGroup.addRow(
        this.exampleRow(example, () => {
          learnController.dispatch("copy", { code: example.code });
        })
      );
    }
    const examplesClamp = new Adw.Clamp();
    examplesClamp.maximumSize = 600;
    examplesClamp.setChild(examplesGroup);

    const examples = new Adw.StatusPage();
    examples.iconName = codeSymbolic;
    examples.title = _("Examples");
    examples.description = _("Try out example programs for the 6502 microprocessor.");
    examples.setChild(asView(examplesClamp));
    const examplesScroll = new ScrollView();
    examplesScroll.content = examples;

    nav.add(mainPage, "main");
    nav.add(tutorialScroll, "tutorial");
    nav.add(examplesScroll, "examples");
    return asView(nav);
  }

  /** A tappable example row: a code icon, the example title + description, and a
   *  go-next chevron. Tapping loads the example into the editor. */
  private exampleRow(example: ExampleMeta, onTap: () => void): Adw.ActionRow {
    return this.navRow(_(example.title), _(example.description), codeSymbolic, onTap);
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
    row.setPrefix(prefix);
    const chevron = new Gtk.Image();
    chevron.iconName = goNextSymbolic;
    row.setSuffix(chevron);
    row.addEventListener("tap", onTap);
    return row;
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
  };
}

export { learnView };
