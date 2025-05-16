import { Component } from "nano-jsx/esm/index.js";

export class GtkWidget<P extends Object = any, S = any> extends Component<
  P,
  S
> {
  static propertyNames = [
    "can-focus",
    "can-target",
    "css-classes",
    "css-name",
    "cursor",
    "focus-on-click",
    "focusable",
    "halign",
    "has-default",
    "has-focus",
    "has-tooltip",
    "height-request",
    "hexpand",
    "hexpand-set",
    "layout-manager",
    "margin-bottom",
    "margin-end",
    "margin-start",
    "margin-top",
    "name",
    "opacity",
    "overflow",
    "parent",
    "receives-default",
    "root",
    "scale-factor",
    "sensitive",
    "tooltip-markup",
    "tooltip-text",
    "valign",
    "vexpand",
    "vexpand-set",
    "visible",
    "width-request",
  ];

  static reservedPropertyNames = ["class", "children"];

  static defaultProps = {
    // TODO: Implement default props
  };

  constructor(props: P) {
    super(props);
    this.setDefaultProps();
  }

  public render() {
    return (
      <child>
        <object class="GtkWidget"></object>
      </child>
    );
  }

  protected setDefaultProps(): void {
    this.props = {
      ...GtkWidget.defaultProps,
      ...this.props,
    };
  }
}
