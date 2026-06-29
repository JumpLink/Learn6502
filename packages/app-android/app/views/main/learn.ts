import type { View } from "@nativescript/core";
import { ScrollView } from "@nativescript/core";
import {
  AdwActionRow,
  AdwClamp,
  AdwIcon,
  AdwNavigationView,
  AdwPreferencesGroup,
  AdwStatusPage,
} from "@gjsify/adwaita-nativescript";
import { goNextSymbolic } from "@gjsify/adwaita-icons/actions";
import { schoolSymbolic, openBookSymbolic, codeSymbolic } from "~/icons";
import { localize as _ } from "@nativescript/localize";
import type { LearnView, SourceViewCopyEvent } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";
import { TutorialView } from "~/mdx/tutorial-view";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";

/**
 * Learn view — implements LearnView. Now a scrollable content view (the MDX
 * TutorialView) added to the shell's AdwViewStack. Copy-to-editor events are still
 * routed through learnController.
 */
class Learn implements LearnView {
  private tutorialView: TutorialView | null = null;
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

    const nav = new AdwNavigationView();

    // --- Main page: an AdwStatusPage hero (icon + title + description) over a
    //     boxed list of Tutorial + Examples rows, matching the GNOME learn.blp. ---
    const group = new AdwPreferencesGroup();
    group.addRow(
      this.navRow(_("Tutorial"), _("Step-by-step guide to 6502 assembly"), openBookSymbolic, () => nav.push("tutorial"))
    );
    group.addRow(this.navRow(_("Examples"), _("Try out example programs"), codeSymbolic, () => nav.push("examples")));
    const mainClamp = new AdwClamp();
    mainClamp.maximumSize = 600;
    mainClamp.setChild(group);

    const mainPage = new AdwStatusPage();
    mainPage.icon = schoolSymbolic;
    mainPage.title = _("Learn");
    mainPage.description = _("Learn how to program the 6502 microprocessor.");
    mainPage.setChild(mainClamp);

    // --- Tutorial page: the MDX TutorialView ---
    const tutorialScroll = new ScrollView();
    tutorialScroll.content = tutorialView;

    // --- Examples page: placeholder (ExamplesList not yet ported to Android) ---
    const examples = new AdwStatusPage();
    examples.title = _("Examples");
    examples.description = _("Example programs are coming to the Android app.");

    nav.add(mainPage, "main");
    nav.add(tutorialScroll, "tutorial");
    nav.add(examples, "examples");
    return nav;
  }

  /** An activatable boxed-list row: a leading symbolic icon, title + subtitle,
   *  and a trailing go-next chevron (matches the GNOME Adw.ActionRow). */
  private navRow(title: string, subtitle: string, iconSvg: string, onTap: () => void): AdwActionRow {
    const row = new AdwActionRow();
    row.title = title;
    row.subtitle = subtitle;
    const prefix = new AdwIcon();
    prefix.icon = iconSvg;
    row.setPrefix(prefix);
    const chevron = new AdwIcon();
    chevron.icon = goNextSymbolic;
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

/** Build the learn screen for the shell's AdwViewStack. */
export function buildLearnScreen(): ScreenModule {
  return {
    view: learnView.build(),
    onHide: () => learnView.saveScrollPosition(),
  };
}

export { learnView };
