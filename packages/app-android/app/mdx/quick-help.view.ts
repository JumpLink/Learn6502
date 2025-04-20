import { MdxView } from './mdx.view';

export class QuickHelpView extends MdxView {
    constructor() {
        super();
    }

    protected getViewName(): string {
        return 'quick-help';
    }
}