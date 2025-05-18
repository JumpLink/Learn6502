import { EventData, Page, ContentView, View } from "@nativescript/core";
import { TutorialView } from "../../mdx/tutorial-view"; // Adjusted path if necessary
import type { LearnView, SourceViewCopyEvent } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";

class Learn implements LearnView {
  readonly events = learnController.events;
  private page: Page | null = null;
  private tutorialView: TutorialView | null = null;

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    if (!this.page) {
      throw new Error("LearnView (Android): Page not found.");
    }

    this.tutorialView = this.page.getViewById<TutorialView>("tutorialView");

    if (!this.tutorialView) {
      throw new Error(
        "LearnView (Android): TutorialView not found on the page."
      );
    }

    this.tutorialView.events.on("copy", (event: SourceViewCopyEvent) => {
      // Dispatch to both the local events and the common controller
      this.events.dispatch("copy", { code: event.code });

      // Use the common controller to communicate with other components
      learnController.dispatch("copy", { code: event.code });
    });

    // this.page.off(Page.loadedEvent, this.onPageLoaded, this);
    this.page.on(Page.unloadedEvent, this.onPageUnloaded, this);
  }

  // TODO: Not used yet
  public onPageUnloaded(args: EventData): void {
    // Clean up: remove event listeners to prevent memory leaks
    if (this.tutorialView) {
      // Assuming EventDispatcher might need a more specific way to remove listeners
      // or it cleans up internally when the TutorialView is destroyed.
      // For now, no explicit .off() for tutorialView.events if not available/needed.
    }
    if (this.page) {
      this.page.off(Page.unloadedEvent, this.onPageUnloaded, this);
      // also remove loaded listener in case unloaded is called before loaded
      // this.page.off(Page.loadedEvent, this.onPageLoaded, this);
    }
    this.tutorialView = null; // Release reference
    this.page = null; // Release reference
    console.log("LearnView (Android): Page unloaded.");
  }

  // --- LearnView interface methods ---
  public saveScrollPosition(): void {
    // Placeholder for Android. Actual implementation would involve getting scroll position
    // from a ScrollView if TutorialView is scrollable.
    // For example, if TutorialView contains a ScrollView with id="tutorialScrollView":
    // const scrollView = this.page?.getViewById<ScrollView>("tutorialScrollView");
    // if (scrollView) this._lastScrollPosition = scrollView.verticalOffset;
    console.log(
      "LearnView (Android): saveScrollPosition() called (placeholder)."
    );

    // Optionally update common controller if we want to share scroll position
    // learnController.saveScrollPosition();
  }

  public restoreScrollPosition(): void {
    // Placeholder for Android. Actual implementation would involve setting scroll position.
    // GLib.idle_add is GTK-specific. For NativeScript, if dealing with UI updates after layout,
    // one might use setTimeout or view.callLoaded / view.call(()=>{...}, Event.layoutChangedEvent)
    // For example:
    // const scrollView = this.page?.getViewById<ScrollView>("tutorialScrollView");
    // if (scrollView) {
    //   scrollView.scrollToVerticalOffset(this._lastScrollPosition, false);
    // }
    console.log(
      "LearnView (Android): restoreScrollPosition() called (placeholder)."
    );
  }
}

// Create singleton instance of our view controller
const learnView = new Learn();

export const onNavigatingTo = learnView.onNavigatingTo.bind(learnView);
