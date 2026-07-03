import { HtmlWidget } from "./html-widget.compontent.tsx";
import { HtmlOrientable } from "./html-orientable.compontent.tsx";
import { Orientation } from "../../enums/gtk.enums.ts";

/**
 * HtmlBox mirrors GtkBox: a generic flex container used to lay out a group
 * of children. Renders a plain `<div>` carrying an `adw-box` class plus an
 * orientation modifier, so app-web's stylesheet can lay the children out
 * exactly the way the native GtkBox does (flex row/column).
 */
export class HtmlBox extends HtmlWidget implements HtmlOrientable {
  static propertyNames = [...HtmlWidget.propertyNames, ...HtmlOrientable.propertyNames];

  static reservedPropertyNames = [...HtmlWidget.reservedPropertyNames];

  static defaultProps = {
    ...HtmlWidget.defaultProps,
    ...HtmlOrientable.defaultProps,
  };

  constructor(props: any) {
    super(props);
    this.setDefaultProps();
  }

  public render() {
    const orientation = this.props.orientation ?? Orientation.VERTICAL;
    const classes = [
      "adw-box",
      orientation === Orientation.HORIZONTAL ? "adw-box--horizontal" : "adw-box--vertical",
      this.props.class,
    ]
      .filter(Boolean)
      .join(" ");

    return <div class={classes}>{this.props.children}</div>;
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlBox.defaultProps,
      ...this.props,
    };
  }
}