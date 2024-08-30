import { Component, renderSSR } from 'nano-jsx/esm/index.js'

export class GtkLabel extends Component {

    escapeHtml(unsafe: string): string {
        // return unsafe
        //     //  .replace(/&/g, "&amp;")
        //      .replace(/</g, "&lt;")
        //      .replace(/>/g, "&gt;")
        //     //  .replace(/"/g, "&quot;")
        //     //  .replace(/'/g, "&#039;");
            return unsafe
    }

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
        const escapedContent = this.escapeHtml(this.cleanText(renderSSR(this.props.children)));
        return <child>
        <object class="GtkLabel">
            {escapedContent && <property name="label" translatable="true">{escapedContent}</property>}
            {(this.props.useMarkup || this.props['use-markup']) && <property name="use-markup">true</property>}
            {this.props.vexpand && <property name="vexpand">true</property>}
            {this.props.vexpand && <property name="vexpand-set">true</property>}
            {this.props.hexpand && <property name="hexpand">true</property>}
            {this.props.hexpand && <property name="hexpand-set">true</property>}
            {this.props.justify && <property name="justify">{this.props.justify}</property>}
            {this.props.wrap && <property name="wrap">true</property>}
            {classes.length > 0 && <style>
                {classes.map(className => (
                    <class name={className} key={className} />
                ))}
            </style>}
        </object>
      </child>
    }
}