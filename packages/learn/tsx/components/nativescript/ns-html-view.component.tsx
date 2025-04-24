import { Component, renderSSR } from 'nano-jsx'
import { clearExtraSpaces } from '../../utils';

interface NsHtmlViewProps {
    children: any;
    html: string;
    className: string;
}

export class NsHtmlView<P extends NsHtmlViewProps = NsHtmlViewProps> extends Component<P> {
    static propertyNames = ["html", "className"]


    static defaultProps = {
        html: ""
    }

    constructor(props: P) {
        super(props)
    }

    private replaceElement(htmlContent: string, fromElement: string, toElement: string): string {
        return htmlContent.replace(new RegExp(`<${fromElement}>(.*?)<\\/${fromElement}>`, 'g'), `<${toElement}>$1</${toElement}>`);
    }

    public render() {
        const rawHtmlContent = clearExtraSpaces(renderSSR(this.props.children));
        // const htmlContentStr = this.replaceElement(rawHtmlContent, "sub", "small");
        console.log("Render HTML View content:", rawHtmlContent);
        return (
            <ns-html-view class={this.props.className} selectable="true" html={rawHtmlContent} />
        )
    }
}