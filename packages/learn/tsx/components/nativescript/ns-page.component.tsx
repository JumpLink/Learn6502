import { Component } from 'nano-jsx'
import { NsWidget } from './ns-widget.component'

export class NsPage extends NsWidget {
    static propertyNames = [...NsWidget.propertyNames, "actionBarHidden"]

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
            <ns-page {...this.props}>
                {this.props.children}
            </ns-page>
        )
    }
} 