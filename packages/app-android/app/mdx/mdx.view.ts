import { ContentView, Builder, HtmlView, View } from '@nativescript/core';

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
        this.setHtmlViewsFontSize(18);
    }

    // Function to set the font size for all HtmlViews
    protected setHtmlViewsFontSize(fontSize: number): void {
        // Get all HtmlViews recursively
        const htmlViews: HtmlView[] = [];
        this.findAllHtmlViews(this.content, htmlViews);

        // Loop through all found HtmlViews
        htmlViews.forEach((htmlView) => {
            if (htmlView && htmlView.android) {
                // Set the font size directly on the native TextView
                htmlView.android.setTextSize(fontSize);
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