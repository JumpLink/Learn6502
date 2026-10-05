import { renderSSR } from "nano-jsx/esm/index.js";
import { HtmlWidget } from "./html-widget.compontent.tsx";
import { CodeType } from "../../enums/gtk.enums.ts";
import * as Examples from "@learn6502/examples";

const EXAMPLE_NAMES = Object.keys(Examples);

interface HtmlCodeProps {
  /**
   * The example to display, if not provided, the children will be used.
   */
  example?: keyof typeof Examples;
  /**
   * The code to display.
   */
  children?: string;
  /**
   * Inline or block code.
   */
  type: CodeType;
  /**
   * The code to display.
   */
  code?: string;
  /**
   * The class name to use for the code.
   * @example language-6502-assembler:readonly
   */
  className?: string;
  /**
   * Whether the code is readonly.
   */
  readonly?: boolean;
  /**
   * Whether the code is copyable.
   */
  copyable?: boolean;
  /**
   * Whether the code is unselectable.
   */
  unselectable?: boolean;
  /**
   * The language of the code.
   */
  language?: string;
  /**
   * The line numbers to display.
   */
  lineNumbers?: boolean;
  /**
   * Whether to hide the line numbers.
   */
  noLineNumbers?: boolean;
  /**
   * The starting value for line numbers.
   */
  lineNumberStart?: number;
  /**
   * A fixed height (in px) for the block editor, e.g. the tall snake-game
   * listing. Unset lets the editor size to its content (the CodeMirror
   * default).
   */
  height?: number;
  /**
   * A fixed width (in px) for the block editor.
   */
  width?: number;
}

/**
 * HtmlCode mirrors GtkCode: it renders MDX `code`, distinguishing inline
 * code from a fenced code block via `type` (set to BLOCK by HtmlPre when the
 * code is the sole child of a `pre`).
 *
 * Block code renders `<adw-source-view>` — the `@gjsify/adwaita-web/source-view`
 * custom element, the web twin of the GTK target's `SourceView` widget (see
 * `gtk-code.compontent.tsx`). The learn package itself does not depend on
 * `@gjsify/adwaita-web`: this only emits the tag + declarative attributes as
 * markup, the consuming app registers the custom element and CodeMirror
 * upgrades it client-side (progressive enhancement — the raw text is still
 * real, crawlable HTML if JS never runs).
 */
export class HtmlCode extends HtmlWidget<HtmlCodeProps> {
  static propertyNames = [...HtmlWidget.propertyNames];

  static reservedPropertyNames = [...HtmlWidget.reservedPropertyNames, "type", "example"];

  static defaultProps = {
    ...HtmlWidget.defaultProps,
    type: CodeType.INLINE,
  };

  private static _codeBlockCounter = 0;

  constructor(props: HtmlCodeProps) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    let { language, readonly, copyable, unselectable, code, lineNumbers, lineNumberStart, height, width } =
      this.parseAttributes(this.props);

    code = renderSSR(code);
    if (code.endsWith("\n")) {
      code = code.slice(0, -1);
    }

    // Use the Adwaita-web source-view custom element for block code.
    if (this.props.type === CodeType.BLOCK) {
      const id = `sourceView${HtmlCode._codeBlockCounter++}`;
      const isHex = language === "hex";
      const style = height || width ? this.toStyle({ height, width }) : undefined;

      return (
        <adw-source-view
          id={id}
          code={code}
          language={language || undefined}
          readonly={readonly || undefined}
          copyable={copyable || undefined}
          selectable={unselectable ? "false" : undefined}
          line-numbers={lineNumbers || undefined}
          line-number-start={lineNumberStart}
          hex-addresses={isHex || undefined}
          style={style}
        />
      );
    }
    // Inline code
    return <code>{code}</code>;
  }

  /**
   * Parse the attributes.
   * Attributes can be normal attributes or class attributes.
   * Class attributes have the form `class="language-<language>:<modifier>,..."`
   * and are used to specify the language and other modifiers for the code.
   * @param props The props of the code component.
   * @returns The parsed attributes.
   */
  protected parseAttributes(props: HtmlCodeProps): Partial<HtmlCodeProps> {
    let language = props.language || "";
    // MDX code blocks are documentation, so they always render read-only;
    // the only editable source view is the app's own editor.
    let readonly = props.readonly ?? true;
    let copyable = props.copyable || false;
    let unselectable = props.unselectable || false;
    let noLineNumbers = props.noLineNumbers || false;
    let lineNumbers = props.lineNumbers || !noLineNumbers;
    let height = props.height;
    let width = props.width;
    let lineNumberStart = props.lineNumberStart !== undefined ? props.lineNumberStart : language === "hex" ? 0 : 1;
    // E.g. language-6502-assembler:readonly
    const separator = ":";
    const languagePrefix = "language-";
    const examplePrefix = "example-";
    let code = props.children;

    if (!props.className || !props.className.startsWith(languagePrefix)) {
      return {
        language,
        readonly,
        copyable,
        unselectable,
        lineNumbers,
        noLineNumbers,
        code,
        height,
        width,
        lineNumberStart,
      };
    }
    const [langString, ...modifiers] = props.className.split(separator);

    if (langString.startsWith(languagePrefix)) {
      language = langString.slice(languagePrefix.length);
      // Re-evaluate the hex default now that the language is known.
      if (props.lineNumberStart === undefined) {
        lineNumberStart = language === "hex" ? 0 : 1;
      }
    }

    if (modifiers.includes("readonly")) {
      readonly = true;
    }
    if (modifiers.includes("copyable")) {
      copyable = true;
    }
    if (modifiers.includes("unselectable")) {
      unselectable = true;
    }
    if (modifiers.includes("no-line-numbers")) {
      noLineNumbers = true;
    }
    if (modifiers.includes("line-numbers")) {
      lineNumbers = true;
    }
    if (noLineNumbers && !modifiers.includes("line-numbers")) {
      lineNumbers = false;
    }

    // E.g. height=600
    const heightModifier = modifiers.find((modifier) => modifier.startsWith("height="));
    if (heightModifier) {
      height = parseInt(heightModifier.slice(heightModifier.indexOf("=") + 1));
    }

    // E.g. width=600
    const widthModifier = modifiers.find((modifier) => modifier.startsWith("width="));
    if (widthModifier) {
      width = parseInt(widthModifier.slice(widthModifier.indexOf("=") + 1));
    }

    // E.g. example-snake
    const exampleModifier = modifiers.find((modifier) => modifier.startsWith(examplePrefix));
    if (exampleModifier) {
      const exampleName = exampleModifier.slice(examplePrefix.length);
      if (EXAMPLE_NAMES.includes(exampleName)) {
        code = Examples[exampleName as keyof typeof Examples].code;
      } else {
        console.warn(`[HtmlCode] Unknown example: ${exampleName}`);
      }
    }

    // E.g. line-start=0x0600 for 6502's $0600 start address
    const lineStartModifier = modifiers.find((modifier) => modifier.startsWith("line-start="));
    if (lineStartModifier) {
      let startValue: number;
      const valueString = lineStartModifier.slice(lineStartModifier.indexOf("=") + 1).trim();

      // Check if it's a hex value (0x... or $...)
      if (valueString.startsWith("0x") || valueString.startsWith("$")) {
        const hexString = valueString.startsWith("0x") ? valueString.slice(2) : valueString.slice(1);
        startValue = parseInt(hexString, 16);
      } else {
        // Decimal value
        startValue = parseInt(valueString, 10);
      }

      if (!isNaN(startValue) && startValue >= 0) {
        lineNumberStart = startValue;
      } else {
        console.warn(`[HtmlCode] Invalid line-start value: ${valueString}`);
      }
    }

    return {
      language,
      readonly,
      copyable,
      unselectable,
      code,
      lineNumbers,
      noLineNumbers,
      height,
      width,
      lineNumberStart,
    };
  }

  protected toStyle(dimensions: { height?: number; width?: number }): string {
    const parts: string[] = [];
    if (dimensions.height) {
      parts.push(`height:${dimensions.height}px`);
    }
    if (dimensions.width) {
      parts.push(`width:${dimensions.width}px`);
    }
    return parts.join(";");
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlCode.defaultProps,
      ...this.props,
    };
  }
}