import {
  DisplayWidget,
  gameConsoleController,
  DEFAULT_COLOR_PALETTE,
  DEFAULT_DISPLAY_CONFIG,
} from "@learn6502/common-ui";
import {
  CreateViewEventData,
  GridLayout,
  Placeholder,
  Utils,
  Builder,
  ContentView,
  CoreTypes,
} from "@nativescript/core";
import { isAndroid } from "@nativescript/core";
import { Memory, DisplayAddressRange } from "@learn6502/6502";

/**
 * Android implementation of the DisplayWidget using native canvas.
 */
export class Display extends GridLayout implements DisplayWidget {
  private memory: Memory | null = null;
  private canvasImageView: android.widget.ImageView | null = null;
  private bitmap: android.graphics.Bitmap | null = null;
  private canvas: android.graphics.Canvas | null = null;
  private paintObj: android.graphics.Paint | null = null;

  private canvasWidth: number = DEFAULT_DISPLAY_CONFIG.width;
  private canvasHeight: number = DEFAULT_DISPLAY_CONFIG.height;
  private numX: number = DEFAULT_DISPLAY_CONFIG.numX;
  private numY: number = DEFAULT_DISPLAY_CONFIG.numY;
  private pixelSize: number = 0;
  private palette = DEFAULT_COLOR_PALETTE;
  private pendingDraw: boolean = false;

  // Queue for pending pixel updates
  private pendingPixelUpdates: Set<number> = new Set<number>();
  private initializationTimeout: any = null;
  private memoryListenerActive: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    super();

    if (!isAndroid) {
      throw new Error("This implementation is for Android only");
    }

    // Set basic layout properties
    this.horizontalAlignment = CoreTypes.HorizontalAlignment.center;
    this.verticalAlignment = CoreTypes.VerticalAlignment.middle;
    this.backgroundColor = "#000000";
    this.width = this.canvasWidth;
    this.height = this.canvasHeight;

    // Initialize canvas immediately in constructor
    this.initializeCanvas();
  }

  /**
   * Initialize the canvas and ImageView directly as a child
   */
  private initializeCanvas(): void {
    try {
      const context = Utils.android.getApplicationContext();
      if (!context) {
        console.error("Display: Failed to get application context");
        return;
      }

      console.log("Display: Creating native ImageView directly");

      // Create the ImageView for our canvas
      this.canvasImageView = new android.widget.ImageView(context);
      this.canvasImageView.setScaleType(
        android.widget.ImageView.ScaleType.FIT_XY
      );

      // Create a bitmap and canvas
      console.log(
        `Display: Creating bitmap with dimensions ${this.canvasWidth}x${this.canvasHeight}`
      );
      this.bitmap = android.graphics.Bitmap.createBitmap(
        this.canvasWidth,
        this.canvasHeight,
        android.graphics.Bitmap.Config.ARGB_8888
      );

      if (!this.bitmap) {
        console.error("Display: Failed to create bitmap");
        return;
      }

      this.canvas = new android.graphics.Canvas(this.bitmap);

      if (!this.canvas) {
        console.error("Display: Failed to create canvas");
        return;
      }

      // Create paint object for drawing
      this.paintObj = new android.graphics.Paint();
      this.paintObj.setAntiAlias(true);

      // Set the bitmap to the ImageView
      this.canvasImageView.setImageBitmap(this.bitmap);

      // Calculate pixel size based on display dimensions
      this.pixelSize = this.canvasWidth / this.numX;
      console.log(`Display: Pixel size calculated as ${this.pixelSize}`);

      // Add the ImageView as a direct child using ContentView wrapper
      const imageViewWrapper = new ContentView();
      imageViewWrapper.width = this.canvasWidth;
      imageViewWrapper.height = this.canvasHeight;

      // Override createNativeView to return our ImageView
      imageViewWrapper.createNativeView = () => this.canvasImageView;

      this.addChild(imageViewWrapper);

      // Initial clear
      this.clearCanvas();

      console.log("Display: Successfully initialized canvas directly");

      // If memory was already set, draw it now
      if (this.memory && this.pendingDraw) {
        this.setupMemoryListener();
        this.drawAllPixels();
        this.processPendingUpdates();
        this.pendingDraw = false;
      }
    } catch (error) {
      console.error(
        `Display: Error in canvas initialization - ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Set up the memory change listener
   */
  private setupMemoryListener(): void {
    if (this.memoryListenerActive || !this.memory) {
      return;
    }

    // Mark the listener as active before adding it
    this.memoryListenerActive = true;
    console.log("Display: Memory change listener initialized");

    // Listen for memory changes
    this.memory.on("changed", (event) => {
      const addrHex = event.addr.toString(16);
      const valHex = event.val.toString(16);
      // Only respond to display address changes
      if (gameConsoleController.isDisplayAddress(event.addr)) {
        if (this.canvas && this.bitmap && this.paintObj) {
          // Draw the individual pixel directly without calling drawAllPixels
          this.drawSinglePixel(event.addr);
        } else {
          // Queue the update for later
          this.pendingPixelUpdates.add(event.addr);
        }
      }
    });
  }

  /**
   * Updates a single pixel on the display.
   * @param addr Memory address of the pixel to update
   */
  public updatePixel(addr: number): void {
    console.log(`updatePixel called for address: 0x${addr.toString(16)}`);

    // Check if canvas is initialized
    if (!this.canvas) {
      console.error("updatePixel: Canvas is not initialized");
      this.pendingPixelUpdates.add(addr);
      return;
    }

    // Check if memory is initialized
    if (!this.memory) {
      console.error("updatePixel: Memory is not initialized");
      return;
    }

    // Check if paint object is initialized
    if (!this.paintObj) {
      console.error("updatePixel: Paint object is not initialized");
      this.pendingPixelUpdates.add(addr);
      return;
    }

    // Only draw the affected pixel
    this.drawSinglePixel(addr);
  }

  /**
   * Draws a single pixel without redrawing the entire screen
   */
  private drawSinglePixel(addr: number): void {
    if (!this.canvas || !this.paintObj || !this.bitmap || !this.memory) {
      console.error("drawSinglePixel: Required components not initialized");
      return;
    }

    try {
      // Get color from memory using the service
      const memValue = this.memory.get(addr) & 0x0f;
      const color = gameConsoleController.getColorForAddress(addr);

      // Use RGB color values (0-255) for Android
      const red = Math.round(color.red * 255);
      const green = Math.round(color.green * 255);
      const blue = Math.round(color.blue * 255);

      // Set the paint color
      this.paintObj.setARGB(255, red, green, blue);

      // Calculate coordinates
      const [x, y] = gameConsoleController.addrToCoordinates(addr, this.numX);

      // Calculate pixel rectangle
      const left = x * this.pixelSize;
      const top = y * this.pixelSize;
      const right = (x + 1) * this.pixelSize;
      const bottom = (y + 1) * this.pixelSize;

      // Safety check for canvas dimensions
      if (
        left < 0 ||
        top < 0 ||
        right > this.canvasWidth ||
        bottom > this.canvasHeight
      ) {
        console.error(
          `Invalid pixel coordinates: [${left},${top},${right},${bottom}]`
        );
        return;
      }

      // Draw rectangle for the pixel
      this.canvas.drawRect(left, top, right, bottom, this.paintObj);

      // Refresh canvas
      this.refreshCanvas();
    } catch (error) {
      console.error(
        `Error in drawSinglePixel: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Process any pending pixel updates
   */
  private processPendingUpdates(): void {
    if (this.pendingPixelUpdates.size > 0) {
      console.log(
        `Display: Processing ${this.pendingPixelUpdates.size} pending pixel updates`
      );

      // Create a copy to avoid modification during iteration
      const updates = Array.from(this.pendingPixelUpdates);
      this.pendingPixelUpdates.clear();

      for (const addr of updates) {
        this.drawSinglePixel(addr);
      }

      // Ensure canvas refresh
      this.refreshCanvas();
    }
  }

  /**
   * Initializes the display with memory access.
   */
  public initialize(memory: Memory): void {
    if (this.isInitialized) {
      console.log(
        "Display: Already initialized, skipping duplicate initialization"
      );
      return;
    }

    console.log("Display: Initializing with memory");
    this.memory = memory;
    this.isInitialized = true;

    if (!this.memory) {
      console.error("Display: Memory initialization failed");
      return;
    }

    // Check if our bitmap and canvas are ready
    if (!this.bitmap || !this.canvas) {
      console.log("Display: Canvas not yet ready, marking pending draw");
      this.pendingDraw = true;
      return;
    }

    // Canvas and Memory are ready
    this.setupMemoryListener();
    console.log("Display: Drawing initial state");
    this.drawAllPixels();
    this.processPendingUpdates();
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
   * Force redraw of all pixels (for compatibility with GNOME implementation)
   */
  public drawAllPixels(): void {
    console.log("Display: drawAllPixels called");

    if (!this.canvas) {
      console.log(
        "drawAllPixels: Canvas is not initialized, will draw when ready"
      );
      // Mark that we need to draw when canvas becomes available
      this.pendingDraw = true;
      return;
    }

    if (!this.memory) {
      console.error("drawAllPixels: Memory is not initialized");
      return;
    }

    console.log("Display: drawAllPixels - Starting to draw all pixels");

    // First clear the canvas
    this.clearCanvas();

    try {
      // Draw all pixels in the display range
      for (
        let addr = DisplayAddressRange.START;
        addr <= DisplayAddressRange.END;
        addr++
      ) {
        this.drawPixel(addr);
      }

      // Make sure to refresh after drawing all pixels
      this.refreshCanvas();
      console.log("Display: drawAllPixels - Completed drawing all pixels");
    } catch (error) {
      console.error(
        `Error in drawAllPixels: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Draw a single pixel to the canvas.
   */
  private drawPixel(addr: number): void {
    if (!this.canvas) {
      console.error("drawPixel: Canvas is not initialized");
      return;
    }

    if (!this.paintObj) {
      console.error("drawPixel: Paint object is not initialized");
      return;
    }

    if (!this.bitmap) {
      console.error("drawPixel: Bitmap is not initialized");
      return;
    }

    if (!this.memory) {
      console.error("drawPixel: Memory is not initialized");
      return;
    }

    try {
      // Get color from memory using the service
      const memValue = this.memory.get(addr) & 0x0f;
      const color = gameConsoleController.getColorForAddress(addr);

      // Use RGB color values (0-255) for Android
      const red = Math.round(color.red * 255);
      const green = Math.round(color.green * 255);
      const blue = Math.round(color.blue * 255);

      // Set the paint color
      this.paintObj.setARGB(255, red, green, blue);

      // Calculate coordinates
      const [x, y] = gameConsoleController.addrToCoordinates(addr, this.numX);

      // Calculate pixel rectangle
      const left = x * this.pixelSize;
      const top = y * this.pixelSize;
      const right = (x + 1) * this.pixelSize;
      const bottom = (y + 1) * this.pixelSize;

      // Safety check for canvas dimensions
      if (
        left < 0 ||
        top < 0 ||
        right > this.canvasWidth ||
        bottom > this.canvasHeight
      ) {
        console.error(
          `Invalid pixel coordinates: [${left},${top},${right},${bottom}]`
        );
        return;
      }

      // Draw rectangle for the pixel
      this.canvas.drawRect(left, top, right, bottom, this.paintObj);

      // Refresh the canvas after drawing the pixel
      if (addr % 16 === 0) {
        // Only refresh every few pixels for better performance when drawing many
        this.refreshCanvas();
      }
    } catch (error) {
      console.error(
        `Error in drawPixel: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Refresh the canvas by invalidating the view.
   */
  private refreshCanvas(): void {
    if (!this.canvasImageView) {
      console.error("refreshCanvas: Canvas image view is not initialized");
      return;
    }

    try {
      this.canvasImageView.invalidate();
    } catch (error) {
      console.error(
        `Error in refreshCanvas: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Clear the canvas to black.
   */
  private clearCanvas(): void {
    if (!this.canvas) {
      console.error("clearCanvas: Canvas is not initialized");
      return;
    }

    // Clear to black
    this.canvas.drawARGB(255, 0, 0, 0);
    this.refreshCanvas();
  }
}
