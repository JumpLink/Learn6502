import { asView } from "~/utils/as-view";
import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { translate } from "~/utils/translate";
import type { LearnView, LearnViewEventMap } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/core";
import { Learn as LearnWidget, setTranslator } from "@learn6502/ui";
import { TutorialView } from "~/mdx/tutorial-view";
import { logger } from "~/utils";
import type { ScreenModule } from "./editor";
// The shared learn view's source views are `@learn6502/ui`'s; this arm teaches NativeScript what they are.
import "~/widgets/source-view";

// The shared widget's strings go through the app's catalogue.
setTranslator(translate);

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
 * Learn view — implements LearnView. Thin glue around the shared `@learn6502/ui` Learn.
 */
class Learn implements LearnView {
  readonly events = new EventDispatcher<LearnViewEventMap>();

  private widget: LearnWidget | null = null;
  private log = logger.scoped("Learn");

  adopt(widget: LearnWidget): void {
    this.widget = widget;
    widget.events.on("subpage-changed", (event) => {
      // The tutorial's ~750 views are built on its first visit, not with the window.
      if (event.tag === "tutorial") tutorialView?.build();
      this.events.dispatch("subpage-changed", event);
    });
  }

  /** Whether a subpage (Tutorial/Examples) is open — drives the shell's header back button. */
  get hasVisibleSubpage(): boolean {
    return this.widget?.hasVisibleSubpage ?? false;
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
export function buildLearnScreen(widget: LearnWidget): ScreenModule<LearnWidget> {
  learnView.adopt(widget);
  return {
    // The shared `Learn` is typed against the GJS bindings, so it is not a NativeScript view to the compiler.
    view: asView(widget),
    widget,

  };
}

export { learnView };
