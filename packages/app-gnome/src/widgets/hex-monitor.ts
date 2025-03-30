import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import { SourceView } from './source-view.ts'

import type { Memory, HexMonitorOptions, HexMonitor as HexMonitorInterface } from '@easy6502/6502'

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
  declare private _applyButton: Gtk.Button

  // Signal handler IDs
  private _handlerIds: number[] = []

  static {
    GObject.registerClass({
      GTypeName: 'HexMonitor',
      Template,
      InternalChildren: ['sourceView', 'startAddressEntry', 'lengthEntry', 'applyButton'],
      Signals: {
        'changed': {},
      }
    }, this);
  }

  public options: HexMonitorOptions = {
    start: 0x0,
    length: 0xffff,
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
  }

  private connectSignals(): void {
    // Connect to the apply button click signal
    this._handlerIds.push(
      this._applyButton.connect('clicked', this.onApplyClicked.bind(this))
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

  private onApplyClicked(): void {
    const startText = this._startAddressEntry.get_text()
    const lengthText = this._lengthEntry.get_text()

    try {
      const start = this.parseHexInput(startText)
      const length = this.parseHexInput(lengthText)

      // Validate the input
      if (isNaN(start) || isNaN(length)) {
        throw new Error('Invalid hex input. Please enter valid hexadecimal values.')
      }

      if (start < 0 || start > 0xffff) {
        throw new Error('Start address must be between $0000 and $FFFF')
      }

      if (length <= 0) {
        throw new Error('Length must be greater than 0')
      }

      if (start + length - 1 > 0xffff) {
        throw new Error('End address exceeds $FFFF')
      }
      
      // Update options and notify
      this.setOptions({ start, length })
      this.emit('changed')
    } catch (error) {
      console.error('Invalid input:', error)
      
      // Show error message to user
      this.showErrorDialog((error as Error).message);
      
      // Reset the entry fields to the current values
      this._startAddressEntry.set_text(this.options.start.toString(16).padStart(4, '0').toUpperCase())
      this._lengthEntry.set_text(this.options.length.toString(16).padStart(4, '0').toUpperCase())
    }
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

  public setOptions(options: Partial<HexMonitorOptions>): void {
    this.options = { ...this.options, ...options };
  }
}

GObject.type_ensure(HexMonitor.$gtype)