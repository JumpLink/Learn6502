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
        const isGtkNode = /<child>\s*<object\s+class="GtkLabel"/i.test(content);
        const item = {
          index,
          content,
          child,
          isGtkNode,
        } as {
          index: number;
          content: string;
          child: any;
          isGtkNode: boolean;
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
        {/*
          The marker and the item share a font, so `START` puts the marker on
          the first line exactly where a baseline would. `BASELINE` is what
          stood here; it is deprecated in GTK since 4.12, and the NativeScript
          port refuses it along with `BASELINE_FILL` because its layout has no
          baseline to align to — a stated absence, not a gap to fill.
        */}
        {listItems.map((item) => (
          <GtkBox orientation={Orientation.HORIZONTAL}>
            <GtkLabel
              use-markup
              wrap
              valign={Align.START}
              label={this.props.type === TextListType.ORDERED ? `${item.index}. ` : "• "}
            />
            {item.isGtkNode ? (
              item.child
            ) : (
              <GtkLabel use-markup wrap valign={Align.START}>
                {item.content}
              </GtkLabel>
            )}
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