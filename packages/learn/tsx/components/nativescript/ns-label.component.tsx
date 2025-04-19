import { Component } from 'nano-jsx'
import { NsFormattedString } from './ns-formatted-string.tsx'


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

    public render() {
      console.debug("Rendering NsLabel")
      console.debug("Children", this.props.children)
      const props = {
        ...NsLabel.defaultProps,
        ...this.props
      }

      // If children is a single string, use it as the text attribute
      if (this.props.children.length === 1 && typeof this.props.children[0] === 'string') {

        const textContent = this.props.children[0];

        return (
          <ns-label {...props} text={textContent} />
        )
      }
      // Otherwise, wrap children in FormattedString
      else if (this.props.children) {
        return (
          <ns-label {...props}>
            <NsFormattedString>
              {this.props.children}
            </NsFormattedString>
          </ns-label>
        )
      }
      // No children, just render with props
      else {
        return (
          <ns-label {...props} />
        )
      }
    }
}