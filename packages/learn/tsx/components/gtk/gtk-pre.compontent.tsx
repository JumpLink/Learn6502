import { GtkLabel } from "./gtk-label.component.tsx";
import { GtkWidget } from "./gtk-widget.compontent.tsx";
import { GtkCode } from "./gtk-code.compontent.tsx";
import { Justification, CodeType } from "../../enums/gtk.enums.ts";

export class GtkPre extends GtkWidget {
  static propertyNames = [...GtkWidget.propertyNames];

  static reservedPropertyNames = [...GtkWidget.reservedPropertyNames];

  static defaultProps = {
    ...GtkWidget.defaultProps,
  };

  constructor(props: any) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    // If the first child is a code component, return it as is
    if (
      this.props.children.length > 0 &&
      this.props.children[0].component === GtkCode
    ) {
      // Force the code component to be rendered as a block because it's part of a preformatted text block
      this.props.children[0].props.type = CodeType.BLOCK;
      return this.props.children[0];
    }
    // TODO: add support for preformatted text blocks, e.g. monospace text with line breaks and spaces
    return (
      <GtkLabel
        use-markup
        wrap
        vexpand-set
        vexpand
        justify={Justification.FILL}
        margin-top={12}
        margin-bottom={12}
      >
        {this.props.children}
      </GtkLabel>
    );
  }

  protected setDefaultProps(): void {
    this.props = {
      ...GtkPre.defaultProps,
      ...this.props,
    };
  }
}
