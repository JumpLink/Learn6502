import { renderSSR } from 'nano-jsx/esm/index.js'
import { GtkWidget } from './gtk-widget.compontent.tsx'
import { clearExtraSpaces } from '../../utils.ts'
export class GtkLabel extends GtkWidget {
    static propertyNames = [...GtkWidget.propertyNames, 'attributes', 'ellipsize', 'extra-menu', 'justify', 'label', 'lines', 'max-width-chars', 'mnemonic-keyval', 'mnemonic-widget', 'natural-wrap-mode', 'selectable', 'single-line-mode', 'tabs', 'use-markup', 'use-underline', 'width-chars', 'wrap', 'wrap-mode', 'xalign', 'yalign']

    static reservedPropertyNames = [...GtkWidget.reservedPropertyNames]

    render() {
        const classes: string[] = this.props.class ? this.props.class.split(' ') : []
        const content = clearExtraSpaces(renderSSR(this.props.children));
        const propKeys = Object.keys(this.props)
        return <child>
        <object class="GtkLabel">
            {content && <property name="label" translatable="yes">{content}</property>}                    
            {propKeys.map(property => {
                if (GtkLabel.propertyNames.includes(property)) {
                    return <property name={property}>{this.props[property].toString()}</property>
                }
                if (GtkLabel.reservedPropertyNames.includes(property)) {
                    return null
                }
                throw new Error(`[GtkLabel] Unknown property: ${property}`)
            }).filter(item => item !== null)}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
        </object>
      </child>
    }
}