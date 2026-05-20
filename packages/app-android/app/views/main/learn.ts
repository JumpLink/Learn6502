import { EventData, Page, ContentView, View } from "@nativescript/core";
import { TutorialView } from "../../mdx/tutorial-view"; // Adjusted path if necessary
import type { LearnView, SourceViewCopyEvent } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";
import { logger } from "~/utils";

class Learn implements LearnView {
  private page: Page | null = null;
  private tutorialView: TutorialView | null = null;

  // State preservation
  private _isInitialized: boolean = false;
  private _lastScrollPosition: number = 0;

  // Scoped logger for this class
  private log = logger.scoped("Learn");

  public onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    this.page = page;

    this.log.debug(`onNavigatingTo - isInitialized: ${this._isInitialized}`);

    if (!this.page) {
      throw new Error("LearnView (Android): Page not found.");
    }

    this.tutorialView = this.page.getViewById<TutorialView>("tutorialView");

    if (!this.tutorialView) {
      throw new Error("LearnView (Android): TutorialView not found on the page.");
    }

    if (!this._isInitialized) {
      this.log.debug("First initialization");
      this.setupEventListeners();
      this._isInitialized = true;
    } else {
      this.log.debug("Re-connecting to existing state");
      this.setupEventListeners();
      // Restore scroll position if available
      this.restoreScrollPosition();
    }

    this.page.on(Page.unloadedEvent, this.onPageUnloaded, this);
  }

  public onNavigatingFrom(): void {
    this.log.debug("onNavigatingFrom - preserving state");
    // Save current scroll position before navigation
    this.saveScrollPosition();
  }

  private setupEventListeners(): void {
    if (!this.tutorialView) return;

    this.tutorialView.events.on("copy", (event: SourceViewCopyEvent) => {
      // Dispatch copy event through controller
      learnController.dispatch("copy", { code: event.code });
    });
  }

  // TODO: Not used yet
  public onPageUnloaded(args: EventData): void {
    this.log.debug("onPageUnloaded - preserving state");

    // Save scroll position before unloading
    this.saveScrollPosition();

    // Clean up: remove event listeners to prevent memory leaks
    if (this.tutorialView) {
      // Assuming EventDispatcher might need a more specific way to remove listeners
      // or it cleans up internally when the TutorialView is destroyed.
      // For now, no explicit .off() for tutorialView.events if not available/needed.
    }
    if (this.page) {
      this.page.off(Page.unloadedEvent, this.onPageUnloaded, this);
    }

    // Clear references but don't reset initialization state
    this.tutorialView = null;
    this.page = null;

    this.log.debug("LearnView (Android): Page unloaded.");
  }

  // --- LearnView interface methods ---
  public saveScrollPosition(): void {
    // TODO: Implement scroll position saving when TutorialView supports it
    this.log.debug("saveScrollPosition() - placeholder implementation");

    // Optionally update common controller if we want to share scroll position
    // learnController.saveScrollPosition();
  }

  public restoreScrollPosition(): void {
    // TODO: Implement scroll position restoration when TutorialView supports it
    this.log.debug("restoreScrollPosition() - placeholder implementation");
  }

  /**
   * Get initialization status
   */
  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Force re-initialization (useful for testing or reset scenarios)
   */
  resetInitialization(): void {
    this._isInitialized = false;
    this._lastScrollPosition = 0;
  }
}

// Create singleton instance of our view controller
const learnView = new Learn();

export const onNavigatingTo = learnView.onNavigatingTo.bind(learnView);
export const onNavigatingFrom = learnView.onNavigatingFrom.bind(learnView);
export { learnView };
