import { GtkWidget } from './gtk-widget.compontent.tsx'
import { GtkBox } from './gtk-box.component.tsx'
import { CodeType } from '../../enums/gtk.enums.ts'

export class GtkCode extends GtkWidget {
    static propertyNames = [...GtkBox.propertyNames]

    static reservedPropertyNames = [...GtkBox.reservedPropertyNames, 'type']

    static defaultProps = {
        ...GtkWidget.defaultProps,
        type: CodeType.INLINE,
    }

    constructor(props: any) {
        super(props)
        this.setDefaultProps()
    }

    render() {
        if (this.props.type === CodeType.BLOCK) {
          return <child>
            <object class="GtkSourceView">
              <property name="auto-indent">true</property>
              <property name="indent-width">4</property>
              <property name="show-line-numbers">true</property>
              <property name="monospace">true</property>
            </object>
          </child>
        }
        // Inline code
        return <tt>{this.props.children}</tt>
        // TODO: How to set named colors?
        // return <span color="@accent_color" font_family="monospace">{this.props.children}</span>
    }

    protected setDefaultProps(): void {
        this.props = {
            ...GtkCode.defaultProps,
            ...this.props,
        }
    }
}