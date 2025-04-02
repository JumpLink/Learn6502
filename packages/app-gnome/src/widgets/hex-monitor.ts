import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { SourceView } from './source-view.ts'

import type { Memory, HexMonitorOptions, HexMonitor as HexMonitorInterface } from '@learn6502/6502'
import { throttle } from '@learn6502/6502'

import Template from './hex-monitor.blp'

/**
 * A widget that displays a hex monitor.
 * @emits changed - when the monitor content is updated
 */
export class HexMonitor extends Adw.Bin implements HexMonitorInterface {

  // Child widgets
  declare private _sourceView: SourceView
  declare private _startAddressEntry: Gtk.Entry
  declare private _lengthEntry: Gtk.Entry

  // Signal handler IDs
  private _handlerIds: number[] = []

  static {
    GObject.registerClass({
      GTypeName: 'HexMonitor',
      Template,
      InternalChildren: ['sourceView', 'startAddressEntry', 'lengthEntry'],
      Signals: {
        'changed': {},
      }
    }, this);
  }

  public options: HexMonitorOptions = {
    start: 0x0,
    length: 0xff,
  };

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    this.setupUI()
    this.connectSignals()

    // Ensure signal handlers are disconnected when widget is finalized
    this.connect('destroy', this.disconnectSignals.bind(this))
  }

  private setupUI(): void {
    // Set initial values in the entry fields
    this._startAddressEntry.set_text(this.options.start.toString(16).padStart(4, '0').toUpperCase())
    this._lengthEntry.set_text(this.options.length.toString(16).padStart(4, '0').toUpperCase())
    this.validateAndApply();
  }

  private connectSignals(): void {
    // Connect to entry changed signals
    this._handlerIds.push(
      this._startAddressEntry.connect('changed', this.onEntryChanged.bind(this)),
      this._lengthEntry.connect('changed', this.onEntryChanged.bind(this))
    )
  }

  private disconnectSignals(): void {
    // Disconnect all signal handlers
    this._handlerIds.forEach(id => this.disconnect(id))
    this._handlerIds = []
  }

  /**
   * Parse a hexadecimal string, handling common hex prefixes
   * @param hexString - Hex string, possibly with 0x or $ prefix
   * @returns Parsed number or NaN if invalid
   */
  private parseHexInput(hexString: string): number {
    // Remove whitespace
    let cleaned = hexString.trim();

    // Remove hex prefixes if present
    if (cleaned.startsWith('0x') || cleaned.startsWith('0X')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.startsWith('$')) {
      cleaned = cleaned.substring(1);
    }

    // Parse as hex
    return parseInt(cleaned, 16);
  }

  private onEntryChanged(): void {
    // Use the throttled version of validateAndApplyValues
    this.validateAndApply();
  }


  // Throttled validation method
  private validateAndApply = throttle(this._validateAndApplyValues.bind(this), 349);

  private _validateAndApplyValues(): void {
    const startText = this._startAddressEntry.get_text();
    const lengthText = this._lengthEntry.get_text();

    // If fields are empty, wait for more input
    if (startText === '' || lengthText === '') {
      return;
    }

    let start = this.parseHexInput(startText);
    let length = this.parseHexInput(lengthText);
    let changed = false;

    // Validate start address
    if (isNaN(start)) {
      start = 0;
      changed = true;
    } else if (start < 0) {
      start = 0;
      changed = true;
    } else if (start > 0xffff) {
      start = 0xffff;
      changed = true;
    }

    // Validate length
    if (isNaN(length)) {
      length = 1;
      changed = true;
    } else if (length <= 0) {
      length = 1;
      changed = true;
    }

    // Adjust length if end address exceeds maximum
    const endAddress = start + length - 1;
    if (endAddress > 0xffff) {
      length = 0xffff - start + 1;
      changed = true;
    }

    // Update entry fields if values were adjusted
    if (changed) {
      this._startAddressEntry.set_text(start.toString(16).padStart(4, '0').toUpperCase());
      this._lengthEntry.set_text(length.toString(16).padStart(4, '0').toUpperCase());
    }

    // Apply the values
    if (this.options.start !== start || this.options.length !== length) {
      this.setMonitorRange(start, length);
      this.emit('changed');
    }
  }

  private showErrorDialog(message: string): void {
    const dialog = new Adw.MessageDialog({
      heading: 'Input Error',
      body: message,
      close_response: 'close',
      transient_for: this.get_root() as Gtk.Window,
      modal: true,
    });

    dialog.add_response('close', '_Close');
    dialog.present();
  }

  public update(memory: Memory) {
    let content = '';

    const end = this.options.start + this.options.length - 1;

    if (!isNaN(this.options.start) && !isNaN(this.options.length) && this.options.start >= 0 && this.options.length > 0 && end <= 0xffff) {
      content = memory.format({ start: this.options.start, length: this.options.length, includeAddress: false, includeSpaces: true, includeNewline: true });
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    this._sourceView.code = content;
  }

  public setMonitorRange(start: number, length: number): void {
    this.options.start = start;
    this.options.length = length;
    this._sourceView.lineNumberStart = start;
  }
}

GObject.type_ensure(HexMonitor.$gtype)