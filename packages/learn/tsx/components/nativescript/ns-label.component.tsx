import { Component, renderSSR } from 'nano-jsx'
import { NsFormattedString } from './ns-formatted-string.tsx'
import { NsSpan } from './ns-span.component.tsx'
import { clearExtraSpaces } from '../../utils.ts'


export class NsLabel extends Component {
    static propertyNames = [
        "text",
        "textWrap",
        "fontSize",
        "fontWeight",
        "textAlignment"
    ]

    static defaultProps = {
        textWrap: "true"
    }

    constructor(props: any) {
        super(props)
    }

    // Wraps string children in NsSpan elements
    processChildren(children: any) {
        if (!children) return null;

        if (typeof children === 'string') {
          return <NsSpan text={children} />;
        }
        
        if (Array.isArray(children)) {
          return children.map(child => this.processChildren(child));
        }
        
        if (typeof children === 'object' && children.props && children.props.children) {
          const newChildren = this.processChildren(children.props.children);
          return { ...children, props: { ...children.props, children: newChildren } };
        }
        
        return children;
      };

    public render() {
      const props = {
        ...NsLabel.defaultProps,
        ...this.props
      }


      return <ns-label {...props}>
            <NsFormattedString>
                {this.processChildren(this.props.children)}
            </NsFormattedString>
        </ns-label>
    }
}