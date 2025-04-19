import { Component } from 'nano-jsx'
import { NsFormattedString } from './ns-formatted-string.tsx'
import { NsLabel } from './ns-label.component.tsx'

export class NsSpan extends Component {
    static propertyNames = [
        "text",
        "textWrap",
        "fontSize",
        "fontWeight",
        "textAlignment",
        "fontFamily",
        "fontStyle",
        "fontVariationSettings",
        "textDecoration",
        "color",
        "backgroundColor",
        "iosAccessibilityAdjustsFontSize",
        "iosAccessibilityMinFontScale",
        "iosAccessibilityMaxFontScale",
        "tappable"
    ]

    static defaultProps = {
    }

    static reservedPropertyNames = []

    constructor(props: any) {
        super(props)
    }

    public render() {
      const props = {
        ...NsSpan.defaultProps,
        ...this.props
      }

      return <ns-span {...props} />
    }
}