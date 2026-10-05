import { Component } from "nano-jsx/esm/index.js";

/**
 * Base class for the HTML target's component set.
 *
 * Mirrors GtkWidget's role (the common base every leaf/container component
 * extends) but adapted to HTML: GTK needs a strict property allow-list
 * because every value round-trips through a `<property name="...">` GObject
 * XML element, while an HTML attribute is valid for (almost) any name
 * (`data-*`, `aria-*`, ...). So instead of validating props, this base just
 * documents the small set of global attributes the HTML components care
 * about and provides the same default-props plumbing as its GTK/NS twins.
 */
export class HtmlWidget<P extends object = any, S = any> extends Component<P, S> {
  static propertyNames = ["id", "class", "style", "title", "hidden", "tabindex", "lang", "dir", "role"];

  static reservedPropertyNames = ["children"];

  static defaultProps = {
    // TODO: Implement default props
  };

  constructor(props: P) {
    super(props);
    this.setDefaultProps();
  }

  public render() {
    const props = this.props as any;
    return <div class={props.class}>{props.children}</div>;
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlWidget.defaultProps,
      ...this.props,
    };
  }
}