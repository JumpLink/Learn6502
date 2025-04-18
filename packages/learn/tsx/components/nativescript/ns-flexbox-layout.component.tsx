import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsFlexboxLayout extends NsWidget {
    static propertyNames = [
        ...NsWidget.propertyNames, 
        "flexDirection", 
        "flexWrap", 
        "justifyContent", 
        "alignItems", 
        "alignContent"
    ]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps,
        flexDirection: "row",
        flexWrap: "nowrap",
        justifyContent: "flex-start",
        alignItems: "stretch",
        alignContent: "stretch"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-flexbox-layout {...this.props}>
                {this.props.children}
            </ns-flexbox-layout>
        )
    }
} 