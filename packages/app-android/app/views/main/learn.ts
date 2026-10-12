import type { View } from "@nativescript/core";
import { asView } from "~/utils/as-view";
import { Utils } from "@nativescript/core";
import { padForSystemInsets } from "@gjsify/adwaita-nativescript";
import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { localize } from "@nativescript/localize";
import type { LearnView, LearnViewEventMap } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";
import { Learn as LearnWidget, setTranslator } from "@learn6502/ui";
import { TutorialView } from "~/mdx/tutorial-view";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";
// The shared learn view's source views and example displays are `@learn6502/ui`'s; these arms teach NativeScript what they are.
import "~/widgets/source-view";
import "~/widgets/game-console/display";

const SHARE_URL = "https://github.com/JumpLink/Learn6502";

// The shared widget's strings go through the app's catalogue.
setTranslator(localize);

// The `$TutorialView` the shared `learn.blp` names: its content is generated from the MDX per platform.
let tutorialView: TutorialView | null = null;
class LearnTutorialView extends TutorialView {
  constructor() {
    super();
    this.className = "mx-4";
    setTutorialView(this);
  }
}
function setTutorialView(view: TutorialView): void {
  tutorialView = view;
}
registerTemplateClass("TutorialView", LearnTutorialView);

/**
 * Learn view — implements LearnView. Thin glue around the shared `@learn6502/ui` Learn: the
 * shell's back button and the system insets are Android's own.
 */
class Learn implements LearnView {
  readonly events = new EventDispatcher<LearnViewEventMap>();

  private widget: LearnWidget | null = null;
  private releaseInsets: (() => void)[] = [];
  private log = logger.scoped("Learn");

  build(): View {
    // The shared `Learn` is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    const widget = new LearnWidget();
    this.widget = widget;
    widget.events.on("subpage-changed", (event) => {
      // The tutorial's ~750 views are built on its first visit, not with the window.
      if (event.tag === "tutorial") tutorialView?.build();
      this.events.dispatch("subpage-changed", event);
    });
    widget.events.on("share", () => Utils.openUrl(SHARE_URL));
    return asView(widget);
  }

  /** Whether a subpage (Tutorial/Examples) is open — drives the shell's header back button. */
  get hasVisibleSubpage(): boolean {
    return this.widget?.hasVisibleSubpage ?? false;
  }

  /** Pop one level. Returns true if a page was popped, so the caller can consume the back press. */
  navigateBack(): boolean {
    if (!this.widget?.hasVisibleSubpage) return false;
    this.widget.navigateBack();
    return true;
  }

  /** Whether the pages reach the screen's bottom edge (the wide layout): their scrolling content
   *  then ends a gesture area higher, while the page background runs on to the edge. */
  padSystemInsets(on: boolean): void {
    for (const release of this.releaseInsets) release();
    this.releaseInsets = [];
    if (!on || !this.widget) return;
    // The scrollers are the widget's internal children, typed against the GJS bindings; at run time they are NativeScript views.
    const { _tutorialScroll, _examplesScroll } = this.widget as unknown as Record<string, { get_child(): unknown }>;
    this.releaseInsets = [_tutorialScroll, _examplesScroll].map((scroll) =>
      padForSystemInsets(scroll.get_child() as View)
    );
  }

  // --- LearnView interface ---
  saveScrollPosition(): void {
    this.widget?.saveScrollPosition();
  }

  restoreScrollPosition(): void {
    this.widget?.restoreScrollPosition();
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
