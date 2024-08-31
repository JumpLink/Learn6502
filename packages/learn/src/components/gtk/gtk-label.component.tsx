import { Component, renderSSR, Fragment } from 'nano-jsx/esm/index.js'
import { GtkWidget } from './gtk-widget.compontent.tsx'

export class GtkLabel extends Component {
    static propertyNames = [...GtkWidget.propertyNames, 'attributes', 'ellipsize', 'extra-menu', 'justify', 'label', 'lines', 'max-width-chars', 'mnemonic-keyval', 'mnemonic-widget', 'natural-wrap-mode', 'selectable', 'single-line-mode', 'tabs', 'use-markup', 'use-underline', 'width-chars', 'wrap', 'wrap-mode', 'xalign', 'yalign']

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
        const content = this.cleanText(renderSSR(this.props.children));
        const propKeys = Object.keys(this.props)
        return <child>
        <object class="GtkLabel">
            {content && <property name="label" translatable="true">{content}</property>}                    
            {propKeys.map(property => {
                if (GtkLabel.propertyNames.includes(property)) {
                    return <property name={property}>{this.props[property].toString()}</property>
                }
                if (GtkLabel.reservedPropertyNames.includes(property)) {
                    return null
                }
                throw new Error(`Unknown property: ${property}`)
            })}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
        </object>
      </child>
    }
}