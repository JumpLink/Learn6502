import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import type cairo from "cairo";
import Template from "./display.blp";

import { type DisplayWidget, gameConsoleService } from "@learn6502/common-ui";
import {
  DEFAULT_COLOR_PALETTE,
  DEFAULT_DISPLAY_CONFIG,
} from "@learn6502/common-ui/src/data/display-constants";
import { type Memory, DisplayAddressRange } from "@learn6502/6502";

export class Display extends Adw.Bin implements DisplayWidget {
  // Child widgets
  declare private _drawingArea: Gtk.DrawingArea;

  static {
    GObject.registerClass(
      {
        GTypeName: "Display",
        Template,
        InternalChildren: ["drawingArea"],
      },
      this
    );
  }

  private canvasWidth: number = DEFAULT_DISPLAY_CONFIG.width;
  private canvasHeight: number = DEFAULT_DISPLAY_CONFIG.height;
  private pixelSize: number = 0;
  private numX: number = DEFAULT_DISPLAY_CONFIG.numX;
  private numY: number = DEFAULT_DISPLAY_CONFIG.numY;
  private memory: Memory | undefined;
  private palette = DEFAULT_COLOR_PALETTE;

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);
    if (!this._drawingArea) {
      throw new Error("DrawingArea is required");
    }

    this.reset();
  }

  /**
   * Initializes the display.
   */
  public initialize(memory: Memory): void {
    this.memory = memory;
    this.memory.on("changed", (event) => {
      if (gameConsoleService.isDisplayAddress(event.addr)) {
        this.updatePixel(event.addr);
      }
    });

    this.canvasWidth = this._drawingArea.get_content_width();
    this.canvasHeight = this._drawingArea.get_content_height();
    if (!this.canvasWidth || !this.canvasHeight) {
      throw new Error("DrawingArea is required");
    }
    this.pixelSize = this.canvasWidth / this.numX;
    this.reset();
  }

  /**
   * Clears the display.
   */
  public reset(): void {
    this._drawingArea.set_draw_func(
      this.drawClear.bind(this) as Gtk.DrawingAreaDrawFunc
    );
    this._drawingArea.queue_draw();
  }

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   * @param memory - The Memory object containing the pixel data.
   */
  public updatePixel(_addr: number): void {
    this._drawingArea.set_draw_func(
      this.drawPixels.bind(this) as Gtk.DrawingAreaDrawFunc
    );
    this._drawingArea.queue_draw();
  }

  private drawClear(
    _drawingArea: Gtk.DrawingArea,
    cr: cairo.Context,
    width: number,
    height: number
  ) {
    const black = { red: 0, green: 0, blue: 0 };
    cr.setSourceRGB(black.red, black.green, black.blue); // Set color to black
    cr.paint(); // Paint the entire drawing area with the color above
  }

  private drawPixels(
    _drawingArea: Gtk.DrawingArea,
    cr: cairo.Context,
    width: number,
    height: number
  ) {
    if (!this.memory) {
      return;
    }
    // Iterate over the address range and draw pixels
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      this.drawPixel(cr, addr);
    }
  }

  private drawPixel(cr: cairo.Context, addr: number) {
    const color = gameConsoleService.getColorForAddress(addr);
    const [x, y] = gameConsoleService.addrToCoordinates(addr, this.numX);

    cr.setSourceRGB(color.red, color.green, color.blue);
    cr.rectangle(
      x * this.pixelSize,
      y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
    cr.fill();
  }
}

GObject.type_ensure(Display.$gtype);
