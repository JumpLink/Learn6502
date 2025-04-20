import { ContentView, Builder, HtmlView, View } from '@nativescript/core';

export abstract class MdxView extends ContentView {
    constructor() {
        super();
    }

    // Abstrakte Methode, die von den Unterklassen implementiert werden muss
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
        
        // Setze die Schriftgröße für alle HtmlViews
        this.setHtmlViewsFontSize(18); // Hier die gewünschte Größe anpassen
    }

    // Funktion, um Schriftgröße für alle HtmlViews zu setzen
    protected setHtmlViewsFontSize(fontSize: number): void {
        // Hole alle HtmlViews rekursiv
        const htmlViews: HtmlView[] = [];
        this.findAllHtmlViews(this.content, htmlViews);
        
        // Schleife durch alle gefundenen HtmlViews
        htmlViews.forEach((htmlView) => {
            if (htmlView && htmlView.android) {
                // Setze die Schriftgröße direkt auf dem nativen TextView
                htmlView.android.setTextSize(fontSize);
            }
        });
    }

    // Rekursive Hilfsmethode zum Finden aller HtmlViews
    private findAllHtmlViews(view: View, results: HtmlView[]): void {
        if (!view) return;
        
        // Prüfe, ob die aktuelle View eine HtmlView ist
        if (view instanceof HtmlView) {
            results.push(view);
        }
        
        // Iteriere durch alle Kind-Views mit eachChildView
        view.eachChildView((childView: View) => {
            this.findAllHtmlViews(childView, results);
            return true; // true bedeutet, die Iteration fortzusetzen
        });
    }
}