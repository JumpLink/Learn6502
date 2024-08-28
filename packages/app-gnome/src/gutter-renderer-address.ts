import GObject from '@girs/gobject-2.0'
import GtkSource from '@girs/gtksource-5'

/**
 * A gutter renderer that displays the address of the line in the hex monitor.
 */
export class GutterRendererAddress extends GtkSource.GutterRendererText {
  static {
    GObject.registerClass({
      GTypeName: 'GutterRendererAddress',
    }, this);
  }

  constructor(params: Partial<GtkSource.GutterRendererText.ConstructorProps> = {}) {
    super(params);
  }

  public vfunc_query_data(gutter: GtkSource.GutterLines, line: number): void {
    const address = line * 0x10;
    const formattedAddress = address.toString(16).padStart(4, '0').toUpperCase();
    this.text = formattedAddress;
  }
}