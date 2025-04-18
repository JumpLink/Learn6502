import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsTextField extends NsWidget {
    static propertyNames = [
        ...NsWidget.propertyNames, 
        "text", 
        "hint", 
        "isEnabled",
        "editable",
        "secure",
        "keyboardType",
        "returnKeyType",
        "maxLength"
    ]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps,
        isEnabled: "true",
        editable: "true",
        secure: "false"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-text-field {...this.props} />
        )
    }
} 