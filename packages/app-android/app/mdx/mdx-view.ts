import { ContentView, Builder, HtmlView, View } from '@nativescript/core';
import { localize } from '@nativescript/localize'

export abstract class MdxView extends ContentView {
    constructor() {
        super();
    }

    // Abstract method that must be implemented by subclasses
    protected abstract getViewName(): string;

    onLoaded() {
        super.onLoaded();

        // Load the XML layout using Builder
        const componentView = Builder.load({
            path: '~/mdx',
            name: this.getViewName()
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

          if(originalHtml === html) {
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