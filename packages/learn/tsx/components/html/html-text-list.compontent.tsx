import { Component } from "nano-jsx/esm/index.js";
import { TextListType } from "../../enums/gtk.enums.ts";

interface HtmlTextListProps {
  type?: TextListType;
  class?: string;
  children?: any;
}

/**
 * HtmlTextList mirrors GtkTextList's role — bridging MDX's `ol`/`ul` into
 * the target's list primitive — but is far simpler: GTK has no native list
 * widget and must fabricate numbered rows out of GtkBox + GtkLabel, while
 * HTML has real `<ol>`/`<ul>` elements. This is just a thin wrapper that
 * picks the right tag and adds an Adwaita-friendly class for styling; the
 * `li` mapping in `html.components.tsx` renders the actual `<li>` items.
 */
export class HtmlTextList extends Component<HtmlTextListProps> {
  static defaultProps: Partial<HtmlTextListProps> = {
    type: TextListType.ORDERED,
  };

  constructor(props: HtmlTextListProps) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    const classes = ["adw-list", this.props.class].filter(Boolean).join(" ");
    if (this.props.type === TextListType.ORDERED) {
      return <ol class={classes}>{this.props.children}</ol>;
    }
    return <ul class={classes}>{this.props.children}</ul>;
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlTextList.defaultProps,
      ...this.props,
    };
  }
}