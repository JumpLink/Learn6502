import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsActionBar extends NsWidget {
    static propertyNames = [
        ...NsWidget.propertyNames, 
        "title", 
        "flat",
        "android.flat",
        "android.icon",
        "ios.systemIcon"
    ]

    static reservedPropertyNames = [...NsWidget.reservedPropertyNames]

    static defaultProps = {
        ...NsWidget.defaultProps
    }

    constructor(props: any) {
        super(props)
    }

    public render() {
        // Using JSX to define the structure that will be parsed by renderSSR
        return (
            <ns-action-bar {...this.props}>
                {this.props.children || ''}
            </ns-action-bar>
        )
    }
} 