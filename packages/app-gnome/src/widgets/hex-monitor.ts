import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import GtkSource from '@girs/gtksource-5'

import { GutterRendererAddress } from '../gutter-renderer-address.ts'

import type { Memory, HexMonitorOptions, HexMonitor as HexMonitorInterface } from '@easy6502/6502'

import Template from './hex-monitor.ui?raw'

export interface HexMonitor {
  // Child widgets
  _sourceView: GtkSource.View
}

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
export class HexMonitor extends Adw.Bin implements HexMonitorInterface {

  static {
    GObject.registerClass({
      GTypeName: 'HexMonitor',
      Template,
      InternalChildren: ['sourceView'],
      Signals: {
        'changed': {
          param_types: [],
        },
      },
    }, this);
  }

  public set text(value: string) {
    this.buffer.text = value;
    this.onUpdate();
  }

  private get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer as GtkSource.Buffer;
  }

  /** The style scheme manager, used to set the style scheme for the monitor */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager, used to determine if the monitor should be dark mode */
  private styleManager = Adw.StyleManager.get_default();

  /** The style scheme for the monitor */
  private _styleScheme: GtkSource.StyleScheme | null = null;

  options: HexMonitorOptions = {
    start: 0x0,
    length: 0xffff,
  };

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupCustomLineNumbers();
    this.setupSignalListeners();
    this._styleScheme = this.updateStyle();
  }

  public update(memory: Memory) {

    let content = '';

    const end = this.options.start + this.options.length - 1;

    if (!isNaN(this.options.start) && !isNaN(this.options.length) && this.options.start >= 0 && this.options.length > 0 && end <= 0xffff) {
      content = memory.format({ start: this.options.start, length: this.options.length, includeAddress: false, includeSpaces: false, includeNewline: true });
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this._sourceView.buffer.set_text(content, content.length);
  }

  public setOptions(options: Partial<HexMonitorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private setupSignalListeners() {
    // cannot use "changed" signal as it triggers many time for pasting
    this.buffer.connect('end-user-action', this.onUpdate.bind(this));
    this.buffer.connect('undo', this.onUpdate.bind(this));
    this.buffer.connect('redo', this.onUpdate.bind(this));

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));
  }

  setupCustomLineNumbers(): void {
    // Hide the default line numbers
    this._sourceView.show_line_numbers = false;

    // Get the existing gutter for the left side
    const gutter = this._sourceView.get_gutter(Gtk.TextWindowType.LEFT);

    // Add custom line numbers renderer
    const customRenderer = new GutterRendererAddress({
      margin_start: 12,
      margin_end: 12,
      width_request: 24,
      focus_on_click: true,
      focusable: true,
    });

    // Insert the custom line numbers renderer
    gutter.insert(customRenderer, 0);
  }

  private onUpdate() {
    this.emit("changed");
  };

  private updateStyle(): GtkSource.StyleScheme {
    const scheme = this.schemeManager.get_scheme(
      this.styleManager.dark ? "Adwaita-dark" : "Adwaita",
    );
    if(!scheme) {
      throw new Error("Could not get style scheme");
    }
    this.buffer.set_style_scheme(scheme);
    this._styleScheme = scheme;
    return this._styleScheme;
  };
}
