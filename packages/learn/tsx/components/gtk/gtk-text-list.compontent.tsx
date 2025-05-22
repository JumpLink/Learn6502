import { Component, renderSSR } from "nano-jsx/esm/index.js";
import { GtkLabel } from "./gtk-label.component.tsx";
import { GtkBox } from "./gtk-box.component.tsx";
import { clearExtraSpaces, filterProperties } from "../../utils.ts";
import { Orientation, Align, TextListType } from "../../enums/gtk.enums.ts";

/**
 * GtkTextList is a component that renders a list of items.
 * It supports both ordered and unordered lists.
 * Used as a replacement for <ol> and <ul> tags for Gtk.
 */
export class GtkTextList extends Component {
  static propertyNames = [...GtkBox.propertyNames];

  static reservedPropertyNames = [...GtkBox.reservedPropertyNames, "type"];

  static defaultProps = {
    ...GtkBox.defaultProps,
    type: TextListType.ORDERED,
  };

  constructor(props: any) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    let index = 1;
    const listItems = this.props.children
      .map((child) => {
        const content = clearExtraSpaces(renderSSR(child));
        if (!content) {
          return null;
        }
        const item = {
          index,
          content,
        };
        index++;
        return item;
      })
      .filter((item) => item !== null);

    // TODO: Implement RTL support
    return (
      <GtkBox
        orientation={Orientation.VERTICAL}
        margin-start={24}
        {...filterProperties(this.props, GtkTextList.propertyNames)}
      >
        {listItems.map((item) => (
          <GtkBox orientation={Orientation.HORIZONTAL}>
            <GtkLabel
              use-markup
              wrap
              xalign={0}
              valign={Align.START}
              label={
                this.props.type === TextListType.ORDERED
                  ? `${item.index}. `
                  : "• "
              }
            >
              {this.props.type === TextListType.ORDERED
                ? `${item.index}. `
                : "• "}
            </GtkLabel>
            <GtkLabel
              use-markup
              wrap
              hexpand-set
              hexpand
              xalign={0}
              halign={Align.FILL}
            >
              {item.content}
            </GtkLabel>
          </GtkBox>
        ))}
      </GtkBox>
    );
  }

  protected setDefaultProps(): void {
    this.props = {
      ...GtkTextList.defaultProps,
      ...this.props,
    };
  }
}
