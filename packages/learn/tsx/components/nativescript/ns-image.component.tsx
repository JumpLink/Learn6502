import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsImage extends NsWidget {
    static propertyNames = [
        ...NsWidget.propertyNames, 
        "src", 
        "imageSource",
        "stretch",
        "loadMode",
        "tintColor",
        "decodeWidth",
        "decodeHeight"
    ]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps,
        stretch: "aspectFit",
        loadMode: "async"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-image {...this.props} />
        )
    }
} 