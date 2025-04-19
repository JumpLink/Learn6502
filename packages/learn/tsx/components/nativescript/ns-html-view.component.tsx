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

    public render() {
        const content = clearExtraSpaces(renderSSR(this.props.children));
        console.log("Render HTML View content:", content);
        return (
            <ns-html-view selectable="true" html={content} />
        )
    }
}