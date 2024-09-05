import { renderSSR } from 'nano-jsx/esm/index.js'
import { GtkWidget } from './gtk-widget.compontent.tsx'
import { GtkBox } from './gtk-box.component.tsx'
import { CodeType } from '../../enums/gtk.enums.ts'
import * as Examples from '../../examples/index.tsx'

interface GtkCodeProps extends Object {
  /**
   * The example to display, if not provided, the children will be used.
   */
  example?: keyof typeof Examples
  /**
   * The code to display.
   */
  children?: string
  /**
   * Inline or block code.
   */
  type: CodeType
  /**
   * The code to display.
   */
  code?: string
  /**
   * The class name to use for the code.
   * @example language-6502-assembler:readonly
   */
  className?: string
  /**
   * Whether the code is readonly.
   */
  readonly?: boolean
  /**
   * Whether the code is unselectable.
   */
  unselectable?: boolean
  /**
   * The language of the code.
   */
  language?: string
  /**
   * The line numbers to display.
   */
  lineNumbers?: boolean
  /**
   * Whether to hide the line numbers.
   */
  noLineNumbers?: boolean
  /**
   * Whether to fit the content width.
   */
  fitContentWidth?: boolean
  /**
   * Whether to fit the content height.
   */
  fitContentHeight?: boolean
  /**
   * The height request of the code.
   */
  heightRequest?: number
  /**
   * The width request of the code.
   */
  widthRequest?: number
  /**
   * The height of the code view.
   */
  height: number
}

export class GtkCode extends GtkWidget<GtkCodeProps> {
    static propertyNames = [...GtkBox.propertyNames]

    static reservedPropertyNames = [...GtkBox.reservedPropertyNames, 'type', 'example']

    static defaultProps = {
        ...GtkWidget.defaultProps,
        type: CodeType.INLINE,
        fitContentHeight: true,
    }

    constructor(props: GtkCodeProps) {
        super(props)
        this.setDefaultProps()
    }

    render() {
      let { language, readonly, unselectable, code, lineNumbers, noLineNumbers, fitContentWidth, fitContentHeight, height } = this.parseAttributes(this.props)
      
      code = renderSSR(code);
      if(code.endsWith('\n')) {
        code = code.slice(0, -1)
      }
      
      // Use the custom editor widget for block code
      if (this.props.type === CodeType.BLOCK) {
        return <child>
          <object class="ExecutableSourceView">
            {code && <property name="code">{code}</property>}
            {language && <property name="language">{language}</property>}
            {readonly && <property name="readonly">{readonly.toString()}</property>}
            {unselectable && <property name="unselectable">{unselectable.toString()}</property>}
            {lineNumbers && <property name="line-numbers">{lineNumbers.toString()}</property>}
            {noLineNumbers && <property name="no-line-numbers">{noLineNumbers.toString()}</property>}
            {fitContentWidth && <property name="fit-content-width">{fitContentWidth.toString()}</property>}
            {!height &&fitContentHeight && <property name="fit-content-height">{fitContentHeight.toString()}</property>}
            {height && <property name="height">{height}</property>}
          </object>
        </child>
      }
      // Inline code
      return <tt>{code}</tt>
      // TODO: How to set named adwaita font colors?
      // return <span color="@accent_color" font_family="monospace">{this.props.children}</span>
    }

    /**
     * Parse the attributes.
     * Attributes can be normal attributes or class attributes.
     * Class attributes have the form `class="language-<language>:<modifier>,..."`
     * and are used to specify the language and other modifiers for the code.
     * @param props The props of the code component.
     * @returns The parsed attributes.
     */
    protected parseAttributes(props: GtkCodeProps): Partial<GtkCodeProps> {
      let language = props.language || ''
      let readonly = props.readonly || false
      let unselectable = props.unselectable || false
      let noLineNumbers = props.noLineNumbers || false
      let lineNumbers = props.lineNumbers || !noLineNumbers
      let fitContentWidth = props.fitContentWidth || false
      let fitContentHeight = props.fitContentHeight || false
      let height = props.height
      // E.g. language-6502-assembler:readonly
      const separator = ':'
      const languagePrefix = 'language-'
      const examplePrefix = 'example-'
      let code = props.children

      if(!props.className || !props.className.startsWith(languagePrefix)) {
        return {
          language,
          readonly,
          unselectable,
          lineNumbers,
          noLineNumbers,
          fitContentWidth,
          fitContentHeight,
          code,
          height,
        }
      }
      const [langString, ...modifiers] = this.props.className.split(separator)

      if(langString.startsWith(languagePrefix)) {
        language = langString.slice(languagePrefix.length)
      }

      if(modifiers.includes('readonly')) {
        readonly = true
      }
      if(modifiers.includes('unselectable')) {
        unselectable = true
      }
      if(modifiers.includes('no-line-numbers')) {
        noLineNumbers = true
      }
      if(modifiers.includes('line-numbers')) {
        lineNumbers = true
      }
      if(modifiers.includes('fit-content-width')) {
        fitContentWidth = true
      }
      if(modifiers.includes('fit-content-height')) {
        fitContentHeight = true
      }

      // E.g. height=600
      const heightModifier = modifiers.find(modifier => modifier.startsWith('height='))
      if(heightModifier) {
        height = parseInt(heightModifier.slice(heightModifier.indexOf('=') + 1))
      }

      // E.g. example-snake
      const exampleModifier = modifiers.find(modifier => modifier.startsWith(examplePrefix))
      if(exampleModifier) {
        const exampleName = exampleModifier.slice(examplePrefix.length)
        code = (Examples as any)[exampleName]
      }
      return {
        language,
        readonly,
        unselectable,
        code,
        lineNumbers,
        noLineNumbers,
        fitContentWidth,
        fitContentHeight,
        height,
      }
    }

    protected setDefaultProps(): void {
        this.props = {
            ...GtkCode.defaultProps,
            ...this.props,
        }
    }
}