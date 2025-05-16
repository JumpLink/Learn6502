import { ContentView, Builder, HtmlView, View } from "@nativescript/core";
import { localize } from "@nativescript/localize";
import { EventDispatcher } from "@learn6502/6502";
import type {
  SourceViewEventMap,
  SourceViewCopyEvent,
} from "@learn6502/common-ui";
import { SourceView } from "~/widgets/source-view";

// Define the event map for MdxView, currently just forwarding copy
export interface MdxViewEventMap {
  copy: SourceViewCopyEvent;
}

export abstract class MdxView extends ContentView {
  // Add events dispatcher
  readonly events = new EventDispatcher<MdxViewEventMap>();

  constructor() {
    super();
  }

  // Abstract method that must be implemented by subclasses
  protected abstract getViewName(): string;

  onLoaded() {
    super.onLoaded();

    // Load the XML layout using Builder
    const componentView = Builder.load({
      path: "~/mdx",
      name: this.getViewName(),
    });

    if (!componentView) {
      console.error(`Failed to load ${this.getViewName()}.xml template`);
      return;
    }

    // Add the componentView to the content
    this.content = componentView;

    // Set the font size for all HtmlViews
    // this.setHtmlViewsFontSize(18);

    // Localize all HtmlViews
    this.localizeHtmlViews();

    // Setup listeners for SourceView copy events
    this.setupSourceViewCopyListeners();
  }

  protected setupSourceViewCopyListeners(): void {
    const sourceViews: SourceView[] = [];
    this.findAllSourceViews(this.content, sourceViews);

    sourceViews.forEach((sourceView) => {
      // Ensure we don't attach multiple listeners if onLoaded is called multiple times
      // or if the sourceView already has a listener from elsewhere (though less likely here)
      // A more robust way might involve checking if a listener is already attached,
      // but EventDispatcher doesn't directly expose that. For now, simple attachment.
      sourceView.events.on("copy", (event: SourceViewCopyEvent) => {
        this.events.dispatch("copy", event); // Re-dispatch the event
      });
    });
  }

  // Recursive helper method to find all SourceViews
  private findAllSourceViews(view: View, results: SourceView[]): void {
    if (!view) return;

    if (view instanceof SourceView) {
      results.push(view);
    }

    view.eachChildView((childView: View) => {
      this.findAllSourceViews(childView, results);
      return true;
    });
  }

  // TODO: We do not need to translate english strings
  protected localizeHtmlViews(): void {
    // Get all HtmlViews recursively
    const htmlViews: HtmlView[] = [];
    this.findAllHtmlViews(this.content, htmlViews);

    // Loop through all found HtmlViews
    htmlViews.forEach((htmlView) => {
      let html: string | undefined;
      const originalHtml = htmlView.html;
      try {
        html = localize(htmlView.html);
      } catch (error) {
        console.error(`Error localizing HTML string "${originalHtml}":`, error);
      }
      if (html) {
        htmlView.html = html;
      }

      if (originalHtml === html) {
        console.log(`HTML string "${originalHtml}" is not localized`);
      }
    });
  }

  // Function to set the font size for all HtmlViews
  protected setHtmlViewsFontSize(fontSize: number): void {
    // Get all HtmlViews recursively
    const htmlViews: HtmlView[] = [];
    this.findAllHtmlViews(this.content, htmlViews);

    // Loop through all found HtmlViews
    htmlViews.forEach((htmlView) => {
      const androidView = htmlView.android as android.widget.TextView;
      if (androidView) {
        // Set the font size directly on the native TextView
        androidView.setTextSize(fontSize);
      }
    });
  }

  // Recursive helper method to find all HtmlViews
  private findAllHtmlViews(view: View, results: HtmlView[]): void {
    if (!view) return;

    // Check if the current view is an HtmlView
    if (view instanceof HtmlView) {
      results.push(view);
    }

    // Iterate through all child views with eachChildView
    view.eachChildView((childView: View) => {
      this.findAllHtmlViews(childView, results);
      return true; // true means continue the iteration
    });
  }
}
