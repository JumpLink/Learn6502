import { Component, renderSSR } from 'nano-jsx'
import { clearExtraSpaces } from '../../utils';

export class NsHtmlView extends Component {
    static propertyNames = ["html"]


    static defaultProps = {
        html: ""
    }

    constructor(props: any) {
        super(props)
    }

    private replaceSubWithSmall(htmlContent: string, fromElement: string, toElement: string): string {
        return htmlContent.replace(new RegExp(`<${fromElement}>(.*?)<\\/${fromElement}>`, 'g'), `<${toElement}>$1</${toElement}>`);
    }

    public render() {
        const rawHtmlContent = clearExtraSpaces(renderSSR(this.props.children));
        const htmlContentStr = this.replaceSubWithSmall(rawHtmlContent, "sub", "small");
        console.log("Render HTML View content:", htmlContentStr);
        return (
            <ns-html-view selectable="true" html={htmlContentStr} />
        )
    }
}