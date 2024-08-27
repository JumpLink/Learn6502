import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
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

  public options: HexMonitorOptions = {
    start: 0x0,
    length: 0xffff,
  };

  private get buffer(): GtkSource.Buffer {
    return this._sourceView.buffer as GtkSource.Buffer;
  }

  /** The style scheme manager, used to set the style scheme for the monitor */
  private schemeManager = GtkSource.StyleSchemeManager.get_default();

  /** The style manager, used to determine if the monitor should be dark mode */
  private styleManager = Adw.StyleManager.get_default();

  /** The style scheme for the monitor */
  private styleScheme: GtkSource.StyleScheme | null = null;

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupSignalListeners();
    this.setupCustomLineNumbers();
    this.styleScheme = this.updateStyle();
    this.setupLanguage();
  }

  public update(memory: Memory) {

    let content = '';

    const end = this.options.start + this.options.length - 1;

    if (!isNaN(this.options.start) && !isNaN(this.options.length) && this.options.start >= 0 && this.options.length > 0 && end <= 0xffff) {
      content = memory.format({ start: this.options.start, length: this.options.length, includeAddress: false, includeSpaces: true, includeNewline: true });
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this.text = content;
    // this.applyCustomFormatting();
  }

  public setOptions(options: Partial<HexMonitorOptions>): void {
    this.options = { ...this.options, ...options };
  }

  private setupLanguage() {
    const languageManager = GtkSource.LanguageManager.get_default();
    // console.log("language_ids", languageManager.language_ids);
    const hexLanguage = languageManager.get_language('hex');
    if (!hexLanguage) {
      throw new Error('Hex language not found')
    }
    this.buffer.set_language(hexLanguage);
  }

  /**
   * Copy the selected text to the clipboard without spaces
   * FIXME: Copied text keeps the spaces
   * @returns 
   */
  private onCopyClipboard() {
    const buffer = this._sourceView.buffer
    const [hasSelection, start, end] = buffer.get_selection_bounds()

    if (hasSelection) {
      const text = buffer.get_text(start, end, false)
      const cleanedText = text.replace(/\s/g, '')

      const display = this.get_display(); // Gdk.Display.get_default(); 
      if (!display) {
        console.error('No display found')
        return false;
      }
      const clipboard =  display.get_clipboard(); // display.get_primary_clipboard();

      const value = new GObject.Value();
      value.init(GObject.TYPE_STRING);
      value.set_string(cleanedText);

      const contentProvider = Gdk.ContentProvider.new_for_value(value)
      const success = clipboard.set_content(contentProvider)
      console.log(`Copy to clipboard: ${success ? 'success' : 'failed'}`)

      return true // Prevent the default copy action
    }

    return false // Allow the default copy action if no text is selected
  }

  private setupSignalListeners() {
    // cannot use "changed" signal as it triggers many time for pasting
    this.buffer.connect('end-user-action', this.onUpdate.bind(this));
    this.buffer.connect('undo', this.onUpdate.bind(this));
    this.buffer.connect('redo', this.onUpdate.bind(this));

    this.styleManager.connect('notify::dark', this.updateStyle.bind(this));

    // FIXME: copy-clipboard signal is working but text in clipboard is not changed
    // this._sourceView.connect('copy-clipboard', this.onCopyClipboard.bind(this));
  }

  private setupCustomLineNumbers(): void {
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
    this.styleScheme = scheme;
    return this.styleScheme;
  };
}
