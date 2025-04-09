import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import cairo from 'cairo'
import Template from './display.blp'

import type { Display as DisplayInterface, Memory, MemoryEvent } from '@learn6502/6502'

export class Display extends Adw.Bin implements DisplayInterface {

  // Child widgets
  declare private _drawingArea: Gtk.DrawingArea

  static {
    GObject.registerClass({
      GTypeName: 'Display',
      Template,
      InternalChildren: ['drawingArea']
    }, this);
  }

  private width: number = 160;
  private height: number = 160;
  private pixelSize: number = 0;
  private numX: number = 32;
  private numY: number = 32;
  private memory: Memory | undefined;

  private palette = [
    "#000000", "#ffffff", "#880000", "#aaffee",
    "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
    "#dd8855", "#664400", "#ff7777", "#333333",
    "#777777", "#aaff66", "#0088ff", "#bbbbbb"
  ];

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params)
    if (!this._drawingArea) {
      throw new Error('DrawingArea is required')
    }

    this.reset()
  }

  /**
   * Initializes the display.
   */
  public initialize(memory: Memory): void {
    this.memory = memory;
    this.memory.on('changed', (event: MemoryEvent) => {
      if ((event.addr >= 0x200) && (event.addr <= 0x5ff)) {
        this.updatePixel(event.addr);
      }
    });

    this.width = this._drawingArea.get_width() || 160;
    this.height = this._drawingArea.get_height() || 160;
    this.pixelSize = this.width / this.numX;
    this.reset();
  }

  /**
   * Clears the display.
   */
  public reset(): void {
    this._drawingArea.set_draw_func(this.drawClear.bind(this) as Gtk.DrawingAreaDrawFunc)
    this._drawingArea.queue_draw()
  }

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   * @param memory - The Memory object containing the pixel data.
   */
  public updatePixel(_addr: number): void {
    this._drawingArea.set_draw_func(this.drawPixels.bind(this) as Gtk.DrawingAreaDrawFunc)
    this._drawingArea.queue_draw()
  }

  private drawClear(_drawingArea: Gtk.DrawingArea, cr: cairo.Context, width: number, height: number) {
    const black = { red: 0, green: 0, blue: 0 }
    cr.setSourceRGB(black.red, black.green, black.blue)  // Set color to white
    cr.paint() // Paint the entire drawing area with the color above
  }

  private drawPixels(_drawingArea: Gtk.DrawingArea, cr: cairo.Context, width: number, height: number) {
    if (!this.memory) {
      return;
    }
    // Über den Adressbereich iterieren und Pixel zeichnen
    for (let addr = 0x200; addr <= 0x5FF; addr++) {
      this.drawPixel(cr, addr)
    }
  }

  private drawPixel(cr: cairo.Context, addr: number) {
    const color = this._getColorForAddress(addr);

    const y = Math.floor((addr - 0x200) / this.numY);
    const x = (addr - 0x200) % this.numX;

    cr.setSourceRGB(color.red, color.green, color.blue);
    cr.rectangle(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
    cr.fill();
  }

  private _getColorForAddress(addr: number): { red: number, green: number, blue: number } {
    if (!this.memory) {
      return { red: 0, green: 0, blue: 0 };
    }
    const value = this.memory.get(addr) & 0x0f;
    const hex = this.palette[value]; // E.g. #dd8855

    // hex to rgb
    const red = parseInt(hex.slice(1, 3), 16) / 255;
    const green = parseInt(hex.slice(3, 5), 16) / 255;
    const blue = parseInt(hex.slice(5, 7), 16) / 255;

    return { red, green, blue };
  }
}

GObject.type_ensure(Display.$gtype)