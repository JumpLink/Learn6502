import { Component, renderSSR } from "nano-jsx/esm/index.js";
import * as Examples from "../../examples/index.tsx"; // Corrected path for Examples

// TODO implement this based on GtkCode

interface NsCodeProps {
  /**
   * The example to display, if not provided, the children will be used.
   */
  example?: keyof typeof Examples;
  /**
   * The code to display (can be JSX).
   */
  children?: any; // Changed from string to any to allow JSX
  /**
   * The code to display (alternative to children).
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
   * Whether the code is copyable (used in parsing, not directly by SourceView).
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
   * Whether to show line numbers.
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
   * Whether to fit the content width (used in parsing, not directly by SourceView).
   */
  fitContentWidth?: boolean;
  /**
   * Whether to fit the content height (used in parsing, not directly by SourceView).
   */
  fitContentHeight?: boolean;
  /**
   * The height of the code view.
   */
  height?: number;
  /**
   * The width of the code view.
   */
  width?: number;
  // Removed Gtk-specific props like 'type', 'heightRequest', 'widthRequest'
  // 'height' and 'width' are kept as general layout properties.
}

export class NsCode extends Component<NsCodeProps> {
  static defaultProps: Partial<NsCodeProps> = {
    // Define NsCode specific defaults if any, or leave empty
    // GtkCode defaults like type: CodeType.INLINE, fitContentHeight: true are not directly applicable
  };

  private static _codeBlockCounter = 0;

  constructor(props: NsCodeProps) {
    super(props);
    this.setDefaultProps();
  }

  protected setDefaultProps(): void {
    this.props = {
      ...NsCode.defaultProps,
      ...this.props,
    };
  }

  /**
   * Parse the attributes.
   * Attributes can be normal attributes or class attributes.
   * Class attributes have the form `class="language-<language>:<modifier>,..."`
   * and are used to specify the language and other modifiers for the code.
   * @param props The props of the code component.
   * @returns The parsed attributes.
   */
  protected parseAttributes(props: NsCodeProps): Partial<NsCodeProps> {
    let language = props.language || "";
    let readonly = props.readonly || false;
    let copyable = props.copyable || false;
    let unselectable = props.unselectable || false;
    let noLineNumbers = props.noLineNumbers || false;
    let lineNumbers =
      props.lineNumbers === undefined ? !noLineNumbers : props.lineNumbers;
    let fitContentWidth = props.fitContentWidth || false;
    let fitContentHeight = props.fitContentHeight || false;
    let height = props.height;
    let width = props.width;
    let lineNumberStart = props.lineNumberStart;
    // Default lineNumberStart logic from GtkCode:
    if (lineNumberStart === undefined) {
      lineNumberStart = language === "hex" ? 0 : 1;
    }

    const separator = ":";
    const languagePrefix = "language-";
    const examplePrefix = "example-";
    let code = props.children || props.code;

    if (!props.className) {
      // Simpler check if className is not provided
      return {
        language,
        readonly,
        copyable,
        unselectable,
        lineNumbers,
        noLineNumbers,
        fitContentWidth,
        fitContentHeight,
        code,
        height,
        width, // Added width here
        lineNumberStart,
      };
    }

    const classParts = props.className.split(separator);
    const langString = classParts[0];
    const modifiers = classParts.slice(1);

    if (langString.startsWith(languagePrefix)) {
      language = langString.slice(languagePrefix.length);
      // Re-evaluate lineNumberStart default if language is set here and lineNumberStart was from initial props
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
      // This will override noLineNumbers if both are present
      lineNumbers = true;
      noLineNumbers = false; // ensure consistency
    }
    // Update lineNumbers based on noLineNumbers if line-numbers modifier wasn't present
    if (!modifiers.includes("line-numbers")) {
      lineNumbers = !noLineNumbers;
    }

    if (modifiers.includes("fit-content-width")) {
      fitContentWidth = true;
    }
    if (modifiers.includes("fit-content-height")) {
      fitContentHeight = true;
    }

    const heightModifier = modifiers.find((modifier) =>
      modifier.startsWith("height=")
    );
    if (heightModifier) {
      height = parseInt(
        heightModifier.slice(heightModifier.indexOf("=") + 1),
        10
      );
    }

    const widthModifier = modifiers.find(
      (
        modifier // Added width parsing
      ) => modifier.startsWith("width=")
    );
    if (widthModifier) {
      width = parseInt(widthModifier.slice(widthModifier.indexOf("=") + 1), 10);
    }

    const exampleModifier = modifiers.find((modifier) =>
      modifier.startsWith(examplePrefix)
    );
    if (exampleModifier) {
      const exampleName = exampleModifier.slice(
        examplePrefix.length
      ) as keyof typeof Examples;
      if (Examples[exampleName]) {
        code = Examples[exampleName];
      } else {
        console.warn(`[NsCode] Unknown example: ${exampleName}`);
      }
    }

    const lineStartModifier = modifiers.find((modifier) =>
      modifier.startsWith("line-start=")
    );
    if (lineStartModifier) {
      let startValue: number;
      const valueString = lineStartModifier
        .slice(lineStartModifier.indexOf("=") + 1)
        .trim();

      if (valueString.startsWith("0x") || valueString.startsWith("$")) {
        const hexString = valueString.startsWith("0x")
          ? valueString.slice(2)
          : valueString.slice(1);
        startValue = parseInt(hexString, 16);
      } else {
        startValue = parseInt(valueString, 10);
      }

      if (!isNaN(startValue) && startValue >= 0) {
        lineNumberStart = startValue;
      } else {
        console.warn(`[NsCode] Invalid line-start value: ${valueString}`);
      }
    }

    return {
      language,
      readonly,
      copyable,
      unselectable,
      code,
      lineNumbers,
      noLineNumbers, // ensure this is returned
      fitContentWidth,
      fitContentHeight,
      height,
      width, // Added width here
      lineNumberStart,
    };
  }

  render() {
    const parsedProps = this.parseAttributes(this.props);

    let codeContent = parsedProps.code || "";
    if (typeof codeContent !== "string") {
      // If codeContent is JSX (e.g. from Examples or children), render it to string
      codeContent = renderSSR(codeContent);
    }

    if (codeContent.endsWith("\\n")) {
      codeContent = codeContent.slice(0, -1);
    }

    const id = `nsSourceView${NsCode._codeBlockCounter++}`;
    const editable = (!parsedProps.readonly).toString();
    const lineNumbers = parsedProps.lineNumbers.toString();
    // If unselectable is true, selectable is false. Otherwise, true (SourceView default is true).
    const selectable = (!parsedProps.unselectable).toString();

    const attributes: any = {
      id,
      code: codeContent,
      editable,
      lineNumbers,
      selectable,
    };

    if (parsedProps.lineNumberStart !== undefined) {
      attributes.lineNumberStart = parsedProps.lineNumberStart;
    }
    if (parsedProps.height !== undefined) {
      attributes.height = parsedProps.height;
    }
    if (parsedProps.width !== undefined) {
      attributes.width = parsedProps.width;
    }

    // Important: JSX for NativeScript needs to be exactly as the XML structure,
    // including namespace prefixes if they are used in the final XML.
    // The 'w:' prefix is for a custom namespace, typically defined in the Page XML.
    // nano-jsx will render <w:SourceView ... /> as a string " <w:SourceView ... /> "
    // This assumes the 'w' namespace is correctly set up in the NativeScript XML context
    // where this component's output will be used.

    return <w:source-view {...attributes} />;
  }
}
