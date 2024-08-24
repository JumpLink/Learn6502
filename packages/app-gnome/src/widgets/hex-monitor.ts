import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'

import type { Memory, MonitorOptions } from '@easy6502/6502'

import Template from './hex-monitor.ui?raw'

interface _HexMonitor {
  // Child widgets
  _sourceView: GtkSource.View
}

class CustomGutterRenderer extends GtkSource.GutterRendererText {
  static {
      GObject.registerClass({
          GTypeName: 'CustomGutterRenderer',
      }, this);
  }

  constructor() {
      super();
  }

  public vfunc_query_data(gutter: GtkSource.GutterLines, line: number): void {
      const text = `C${line + 1}`;
      this.set_text(text, -1);
  }
}

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
class _HexMonitor extends Adw.Bin {

  public set text(value: string) {
    this.buffer.text = value;
    this.onUpdate();
  }

  private get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer as GtkSource.Buffer;
  }

  private start: number = 0x0;
  private length: number = 0xffff;

  /** The style scheme manager */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager */
  private styleManager = Adw.StyleManager.get_default();

  constructor(params: Partial<Adw.Bin.ConstructorProps> & MonitorOptions) {
    super(params)
    this.setupCustomLineNumbers(this._sourceView);
    this.setupSignalListeners();
    this.updateStyle();
  }

  public update(memory: Memory) {

    let content = '';

    const end = this.start + this.length - 1;

    if (!isNaN(this.start) && !isNaN(this.length) && this.start >= 0 && this.length > 0 && end <= 0xffff) {
      content = memory.format(this.start, this.length);
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this._sourceView.buffer.set_text(content, content.length);
  }

  public setRange(startAddress: number, length: number): void {
    this.start = startAddress;
    this.length = length;
  }

  private setupSignalListeners() {
    // cannot use "changed" signal as it triggers many time for pasting
    this.buffer.connect('end-user-action', this.onUpdate.bind(this));
    this.buffer.connect('undo', this.onUpdate.bind(this));
    this.buffer.connect('redo', this.onUpdate.bind(this));

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));
  }

  setupCustomLineNumbers(view: GtkSource.View): void {
    const gutter = view.get_gutter(Gtk.TextWindowType.LEFT);
    const customRenderer = new CustomGutterRenderer();
    // TODO how to remove the existing renderer or replace it?
    gutter.insert(customRenderer, -1);
    view.set_gutter(Gtk.TextWindowType.LEFT, gutter);
  }

  private onUpdate() {
    this.emit("changed");
  };

  private updateStyle() {
    const scheme = this.schemeManager.get_scheme(
      this.styleManager.dark ? "Adwaita-dark" : "Adwaita",
    );
    this.buffer.set_style_scheme(scheme);
  };

}

export const HexMonitor = GObject.registerClass(
  {
    GTypeName: 'HexMonitor',
    Template,
    InternalChildren: ['sourceView'],
    Signals: {
      'changed': {
        param_types: [],
      },
    },
  },
  _HexMonitor
)
