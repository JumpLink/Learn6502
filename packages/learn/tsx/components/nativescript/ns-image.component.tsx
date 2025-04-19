import { Component } from 'nano-jsx'

export class NsImage extends Component {
    static propertyNames = [
        "src",
        "imageSource",
        "stretch",
        "loadMode",
        "tintColor",
        "decodeWidth",
        "decodeHeight"
    ]

    static defaultProps = {
        stretch: "aspectFit",
        loadMode: "async"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        const props = {
            ...NsImage.defaultProps,
            ...this.props
        }
        return (
            <ns-image {...props} />
        )
    }
}