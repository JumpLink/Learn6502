import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import cairo from 'cairo'
import Template from './display.ui?raw'

interface _Display {
  // Child widgets
  _drawingArea: Gtk.DrawingArea
}

class _Display extends Adw.Bin {
  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params)
    if (!this._drawingArea) {
      throw new Error('DrawingArea is required')
    }
    this._drawingArea.set_draw_func(this._draw as Gtk.DrawingAreaDrawFunc)
  }

  _draw(drawingArea: Gtk.DrawingArea, cr: cairo.Context, width: number, height: number) {
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
