import { learnController } from "@learn6502/ui";
import { MdxView } from "./mdx-view";

/**
 * The `$TutorialView` the shared `learn.blp` names. Its ~750 native views cost ~4 s of a cold
 * start on a Galaxy S9, so it builds on `build()` (the first visit) rather than on load.
 */
export class TutorialView extends MdxView {
  constructor() {
    super(true);
    this.events.on("copy", (event) => learnController.dispatch("copy", { code: event.code }));
  }

  protected getViewName(): string {
    return "tutorial";
  }
}
