import {
  DisplayWidget,
  gameConsoleService,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_DISPLAY_CONFIG,
} from "@learn6502/common-ui";
import {
  CreateViewEventData,
  GridLayout,
  Placeholder,
  Utils,
  Builder,
} from "@nativescript/core";
import { isAndroid } from "@nativescript/core";
import { Memory, DisplayAddressRange } from "@learn6502/6502";

/**
 * Android implementation of the DisplayWidget using native canvas.
 */
export class Display extends GridLayout implements DisplayWidget {
  private memory: Memory | undefined;
  private placeholder: Placeholder | undefined;
  private canvasImageView: android.widget.ImageView | undefined;
  private bitmap: android.graphics.Bitmap | undefined;
  private canvas: android.graphics.Canvas | undefined;
  private paintObj: android.graphics.Paint | undefined;

  private canvasWidth: number = DEFAULT_DISPLAY_CONFIG.width;
  private canvasHeight: number = DEFAULT_DISPLAY_CONFIG.height;
  private numX: number = DEFAULT_DISPLAY_CONFIG.numX;
  private numY: number = DEFAULT_DISPLAY_CONFIG.numY;
  private pixelSize: number = 0;
  private palette = DEFAULT_COLOR_PALETTE;

  constructor() {
    super();

    if (!isAndroid) {
      throw new Error("This implementation is for Android only");
    }

    // Load the XML layout when the component is loaded
    this.on("loaded", () => {
      const componentView = Builder.load({
        path: "~/widgets/game-console",
        name: "display",
      });

      // Add the loaded view hierarchy (the Placeholder)
      this.addChild(componentView);

      // Get the Placeholder from the loaded view
      this.placeholder =
        componentView.getViewById<Placeholder>("displayPlaceholder");

      if (!this.placeholder) {
        console.error("Failed to find displayPlaceholder in display.xml");
        return;
      }
    });
  }

  /**
   * Initialize the native canvas view when the placeholder is created.
   * This method is now called automatically via the creatingView attribute in XML.
   */
  public onCreatingView(args: CreateViewEventData): void {
    // Create an ImageView to host our bitmap canvas
    const context = Utils.android.getApplicationContext();
    this.canvasImageView = new android.widget.ImageView(context);
    this.canvasImageView.setScaleType(
      android.widget.ImageView.ScaleType.FIT_XY
    );

    // Create a bitmap and canvas
    this.bitmap = android.graphics.Bitmap.createBitmap(
      this.canvasWidth,
      this.canvasHeight,
      android.graphics.Bitmap.Config.ARGB_8888
    );
    this.canvas = new android.graphics.Canvas(this.bitmap);

    // Create paint object for drawing
    this.paintObj = new android.graphics.Paint();
    this.paintObj.setAntiAlias(true);

    // Set the bitmap to the ImageView
    this.canvasImageView.setImageBitmap(this.bitmap);

    // Attach native view to placeholder
    args.view = this.canvasImageView;

    // Calculate pixel size based on display dimensions
    this.pixelSize = this.canvasWidth / this.numX;

    // Initial clear
    this.clearCanvas();

    // If memory was set before view creation, redraw
    if (this.memory) {
      this.drawAllPixels();
    }
  }

  /**
   * Initializes the display with memory access.
   */
  public initialize(memory: Memory): void {
    this.memory = memory;

    if (!this.memory) {
      throw new Error("Memory not initialized");
    }

    // Listen for memory changes
    this.memory.on("changed", (event) => {
      if (gameConsoleService.isDisplayAddress(event.addr)) {
        this.updatePixel(event.addr);
      }
    });

    // Draw initial state if canvas is ready
    if (this.canvas) {
      this.drawAllPixels();
    }
  }

  /**
   * Resets the display to a black screen.
   */
  public reset(): void {
    if (this.canvas) {
      this.clearCanvas();
    }
  }

  /**
   * Updates a single pixel on the display.
   * @param addr Memory address of the pixel to update
   */
  public updatePixel(addr: number): void {
    if (!this.canvas || !this.memory || !this.paintObj) {
      return;
    }

    this.drawPixel(addr);
  }

  /**
   * Clear the canvas to black.
   */
  private clearCanvas(): void {
    if (!this.canvas) {
      return;
    }

    // Clear to black
    this.canvas.drawARGB(255, 0, 0, 0);
    this.refreshCanvas();
  }

  /**
   * Draw all pixels from memory to the canvas.
   */
  private drawAllPixels(): void {
    if (!this.canvas || !this.memory) {
      return;
    }

    // First clear the canvas
    this.clearCanvas();

    // Draw all pixels in the display range
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      this.drawPixel(addr);
    }

    this.refreshCanvas();
  }

  /**
   * Draw a single pixel to the canvas.
   */
  private drawPixel(addr: number): void {
    if (!this.canvas || !this.paintObj) {
      return;
    }

    // Get color from memory using the service
    const color = gameConsoleService.getColorForAddress(addr);

    // Use RGB color values (0-255) for Android
    const red = Math.round(color.red * 255);
    const green = Math.round(color.green * 255);
    const blue = Math.round(color.blue * 255);

    // Set the paint color
    this.paintObj.setARGB(255, red, green, blue);

    // Calculate coordinates
    const [x, y] = gameConsoleService.addrToCoordinates(addr, this.numX);

    // Draw rectangle for the pixel
    this.canvas.drawRect(
      x * this.pixelSize,
      y * this.pixelSize,
      (x + 1) * this.pixelSize,
      (y + 1) * this.pixelSize,
      this.paintObj
    );

    this.refreshCanvas();
  }

  /**
   * Refresh the canvas by invalidating the view.
   */
  private refreshCanvas(): void {
    if (this.canvasImageView) {
      this.canvasImageView.invalidate();
    }
  }
}
