import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsButton extends NsWidget {
    static propertyNames = [
        ...NsWidget.propertyNames, 
        "text", 
        "isEnabled", 
        "tap",
        "fontSize", 
        "fontWeight",
        "textAlignment"
    ]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps,
        isEnabled: "true"
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Handle children as text if no text property is provided
        const content = this.props.text || this.props.children;
        
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-button {...this.props}>
                {content}
            </ns-button>
        )
    }
} 