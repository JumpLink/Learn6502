import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsStackLayout extends NsWidget {
    static propertyNames = [...NsWidget.propertyNames, "orientation"]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps,
        orientation: "vertical"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-stack-layout {...this.props}>
                {this.props.children}
            </ns-stack-layout>
        )
    }
} 