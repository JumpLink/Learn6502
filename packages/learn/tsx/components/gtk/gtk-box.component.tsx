import { GtkWidget } from './gtk-widget.compontent.tsx'
import { GtkOrientable } from './gtk-orientable.compontent.tsx'

export class GtkBox extends GtkWidget implements GtkOrientable {
    static propertyNames = [...GtkWidget.propertyNames, ...GtkOrientable.propertyNames, "baseline-child", "baseline-position", "homogeneous", "spacing"]

    static reservedPropertyNames = [...GtkWidget.reservedPropertyNames]

    static defaultProps = {
        ...GtkWidget.defaultProps,
        ...GtkOrientable.defaultProps,
    }

    constructor(props: any) {
        super(props)
        this.GtkTextList()
    }

    public render() {
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
                console.warn(`[GtkBox] Ignore unknown property: ${property}`)
                return null
            }).filter(item => item !== null)}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
            {this.props.children}
        </object>
      </child>
    }

    protected GtkTextList(): void {
        this.props = {
            ...GtkBox.defaultProps,
            ...this.props,
        }
    }
}