import { EventData, Page } from '@nativescript/core';
import { SourceView } from '../widgets';

export function onNavigatingTo(args: EventData) {
    const page = args.object as Page;
    const editor = page.getViewById('SourceView') as SourceView;
}
