import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { translate } from "~/utils/translate";
import { Learn, setTranslator } from "@learn6502/ui";
import { TutorialView } from "~/mdx/tutorial-view";
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
