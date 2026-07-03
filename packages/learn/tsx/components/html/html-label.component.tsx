import { HtmlWidget } from "./html-widget.compontent.tsx";

interface HtmlLabelProps {
  /**
   * The HTML tag to render. Mirrors how GtkLabel is reused for every
   * heading level and for paragraphs, distinguished only by an Adwaita
   * style class — here the distinguishing factor is the concrete tag plus
   * the same style class.
   */
  tag?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  class?: string;
  children?: any;
}

/**
 * HtmlLabel mirrors GtkLabel: the single building block every heading level
 * and paragraph in `html.components.tsx` renders through.
 *
 * Unlike GtkLabel — which must flatten its children into one Pango markup
 * string set on a `label` property — HtmlLabel keeps the DOM tree intact.
 * nano-jsx's SSR renderer serializes nested elements (links, `<code>`,
 * `<em>`, `<strong>`) as real nested markup and HTML-escapes plain text
 * automatically, so inline formatting and links inside prose survive as
 * real, crawlable HTML instead of being collapsed into a single string.
 */
export class HtmlLabel extends HtmlWidget<HtmlLabelProps> {
  static defaultProps: Partial<HtmlLabelProps> = {
    tag: "p",
  };

  constructor(props: HtmlLabelProps) {
    super(props);
    this.setDefaultProps();
  }

  render() {
    const { tag, class: className, children } = this.props;
    switch (tag) {
      case "h1":
        return <h1 class={className}>{children}</h1>;
      case "h2":
        return <h2 class={className}>{children}</h2>;
      case "h3":
        return <h3 class={className}>{children}</h3>;
      case "h4":
        return <h4 class={className}>{children}</h4>;
      case "span":
        return <span class={className}>{children}</span>;
      default:
        return <p class={className}>{children}</p>;
    }
  }

  protected setDefaultProps(): void {
    this.props = {
      ...HtmlLabel.defaultProps,
      ...this.props,
    };
  }
}