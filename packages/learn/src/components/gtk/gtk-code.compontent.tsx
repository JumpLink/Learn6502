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
      const { language, readonly } = this.parseLanguage()
      // Use the custom editor widget for block code
      if (this.props.type === CodeType.BLOCK) {
        return <child>
          <object class="SourceView">
            <property name="code">{this.props.children}</property>
            <property name="language">{language}</property>
            <property name="readonly">{readonly.toString()}</property>
          </object>
        </child>
      }
      // Inline code
      return <tt>{this.props.children}</tt>
      // TODO: How to set named colors?
      // return <span color="@accent_color" font_family="monospace">{this.props.children}</span>
    }

    protected parseLanguage(): { language: string, readonly: boolean } {
      let language = '6502-assembler'
      let readonly = false
      const prefix = 'language-'
      if(!this.props.className || !this.props.className.startsWith(prefix)) {
        return {
          language,
          readonly
        }
      }
      const [langString, ...modifiers] = this.props.className.split(':')
      if(modifiers.includes('readonly')) {
        readonly = true
      }
      language = langString.slice(prefix.length)
      return {
        language,
        readonly
      }
    }

    protected setDefaultProps(): void {
        this.props = {
            ...GtkCode.defaultProps,
            ...this.props,
        }
    }
}