import { Orientation } from "../../enums/gtk.enums.ts";

/**
 * HtmlOrientable mirrors GtkOrientable: a component that lays its children
 * out either horizontally or vertically. On the web this drives a CSS
 * modifier class (`adw-box--horizontal`/`adw-box--vertical`) instead of a
 * GObject `orientation` property, but the contract (the prop name + the
 * `Orientation` enum it's expressed in) is shared with the GTK target so the
 * same MDX authoring intent maps identically across render targets.
 */
export abstract class HtmlOrientable {
  static propertyNames = ["orientation"];

  static defaultProps = {
    orientation: Orientation.VERTICAL,
  };
}