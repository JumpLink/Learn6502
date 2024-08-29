import { Component, renderSSR } from 'nano-jsx/esm/index.js'

export class GtkLabel extends Component {

    escapeHtml(unsafe: string): string {
        return unsafe
            //  .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
            //  .replace(/"/g, "&quot;")
            //  .replace(/'/g, "&#039;");
    }

    render() {
        const classes: string[] = this.props.class ? this.props.class.split(' ') : []
        const escapedContent = this.escapeHtml(renderSSR(this.props.children));
        return <child>
        <object class="GtkLabel">
            {escapedContent && <property name="label" translatable="true">{escapedContent}</property>}
            {this.props.useMarkup && <property name="use-markup">true</property>}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
        </object>
      </child>
    }
}