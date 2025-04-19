import { ContentView, Builder } from '@nativescript/core';

export class TutorialView extends ContentView {
    constructor() {
        super();
    }

    onLoaded() {
        super.onLoaded();

        // Load the XML layout using Builder
        const componentView = Builder.load({
            path: '~/mdx',
            name: 'tutorial'
        });

        if (!componentView) {
            console.error('Failed to load tutorial.xml template');
            return;
        }

        // Add the componentView to the content
        this.content = componentView;
    }
}
