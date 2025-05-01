import { Orientation } from "../../enums/gtk.enums.ts";
/**
 * GtkOrientable is an interface that is implemented by widgets that can be oriented.
 * @see https://docs.gtk.org/gtk4/iface.Orientable.html
 */
export abstract class GtkOrientable {
  static propertyNames = ["orientation"];

  static defaultProps = {
    orientation: Orientation.VERTICAL,
  };
}
