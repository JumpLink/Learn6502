import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import cairo from 'cairo'
import Template from './display.ui?raw'

import type { Display as IDisplay } from '@easy6502/6502'

interface _Display {
  // Child widgets
  _drawingArea: Gtk.DrawingArea
}

class _Display extends Adw.Bin implements IDisplay {
  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    if (!this._drawingArea) {
      throw new Error('DrawingArea is required')
    }
    this._drawingArea.set_draw_func(this._draw as Gtk.DrawingAreaDrawFunc)
  }

  /**
   * Initializes the display.
   */
  initialize(): void {

  }

  /**
   * Resets the display to a black screen.
   */
  reset(): void {
    console.error('reset not implemented')
  }

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   * @param memory - The Memory object containing the pixel data.
   */
  updatePixel(addr: number): void {
    console.error('updatePixel not implemented')
  }

  private _draw(drawingArea: Gtk.DrawingArea, cr: cairo.Context, width: number, height: number) {
    cr.setSourceRGB(1, 1, 1)  // Set color to white (RGB: 1, 1, 1)
    cr.paint()  // Paint the entire drawing area with white
  }
}

export const Display = GObject.registerClass(
  {
    GTypeName: 'Display',
    Template,
    InternalChildren: ['drawingArea']
  },
  _Display
)
