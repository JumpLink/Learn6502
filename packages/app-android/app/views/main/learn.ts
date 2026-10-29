import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { Learn } from "@learn6502/ui";
import { TutorialView } from "~/mdx/tutorial-view";
// The shared learn view's source views are `@learn6502/ui`'s; this arm teaches NativeScript what they are.
import "~/widgets/source-view";

// The `$TutorialView` the shared `learn.blp` names: its content is generated from the MDX per platform.
let tutorialView: TutorialView | null = null;
class LearnTutorialView extends TutorialView {
  constructor() {
    super();
    this.className = "mx-4";
    tutorialView = this;
  }
}
registerTemplateClass("TutorialView", LearnTutorialView);

/** The tutorial's ~750 views are built on its first visit, not with the window. */
export function buildTutorialOnFirstVisit(learn: Learn): void {
  learn.events.on("subpage-changed", (event) => {
    if (event.tag === "tutorial") tutorialView?.build();
  });
}
