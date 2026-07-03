import { HtmlWidget } from "./html-widget.compontent.tsx";
import { HtmlCode } from "./html-code.compontent.tsx";
import { CodeType } from "../../enums/gtk.enums.ts";

/**
 * HtmlPre mirrors GtkPre/NsPre: MDX renders a fenced code block as
 * `pre > code`, so `pre` forces its `code` child into BLOCK mode (the
 * `<adw-source-view>` editor) instead of wrapping it in an extra element —
 * exactly like the GTK/NS targets avoid double-nesting their own SourceView
 * widget inside another container.
 */
export class HtmlPre extends HtmlWidget {
  static propertyNames = [...HtmlWidget.propertyNames];

  static reservedPropertyNames = [...HtmlWidget.reservedPropertyNames];

  static defaultProps = {
    ...HtmlWidget.defaultProps,
  };

  constructor(props: any) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    // If the first child is a code component, render it directly as a block
    // (skip the <pre> wrapper — the source-view element owns its own chrome).
    if (this.props.children.length > 0 && this.props.children[0].component === HtmlCode) {
      this.props.children[0].props.type = CodeType.BLOCK;
      return this.props.children[0];
    }
    // Fallback: a plain preformatted text block (no code component detected).
    return <pre>{this.props.children}</pre>;
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlPre.defaultProps,
      ...this.props,
    };
  }
}