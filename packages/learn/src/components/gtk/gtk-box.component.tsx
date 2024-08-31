import { Component } from 'nano-jsx/esm/index.js'
import { GtkWidget } from './gtk-widget.compontent.tsx'
import { GtkOrientable } from './gtk-orientable.compontent.tsx'

export class GtkBox extends Component {
    static propertyNames = [...GtkWidget.propertyNames, ...GtkOrientable.propertyNames, "baseline-child", "baseline-position", "homogeneous", "spacing"]

    static reservedPropertyNames = [...GtkWidget.reservedPropertyNames]

    /**
     * Cleans the text of the label by removing extra whitespace and trimming the text.
     * @param text - The text to clean.
     * @returns The cleaned text.
     */
    cleanText(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }

    render() {
        const classes: string[] = this.props.class ? this.props.class.split(' ') : []
        const propKeys = Object.keys(this.props)
        return <child>
        <object class="GtkBox">                 
            {propKeys.map(property => {
                if (GtkBox.propertyNames.includes(property)) {
                    return <property name={property}>{this.props[property].toString()}</property>
                }
                if (GtkBox.reservedPropertyNames.includes(property)) {
                    return null
                }
                throw new Error(`Unknown property: ${property}`)
            })}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
            {this.props.children}
        </object>
      </child>
    }
}