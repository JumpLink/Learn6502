import { DEFAULT_COLOR_PALETTE, DEFAULT_DISPLAY_CONFIG, type DisplayWidget } from "@learn6502/common-ui";
import { DisplayAddressRange, type Memory, type MemoryChangedEvent } from "@learn6502/core";

/**
 * Display — the 6502 console screen as a `<canvas>`, implementing the shared
 * `DisplayWidget` contract from `@learn6502/common-ui`.
 *
 * Web twin of app-gnome's `Display extends Adw.Bin` (a `Gtk.DrawingArea` +
 * cairo) and app-android's Android canvas display. The 32×32 grid of the memory
 * range `$0200-$05FF` (`DisplayAddressRange`) is painted with the shared 16-entry
 * `DEFAULT_COLOR_PALETTE`; the pixel-plotting math is identical to the classic
 * `app-web/src/display.ts` this replaces (`ctx.fillStyle = palette[val & 0x0f]`
 * — no hex→RGB conversion needed for canvas, unlike cairo's 0-1 float API).
 *
 * The canvas keeps its native 320×320 buffer resolution while CSS scales it to
 * fit the pane with `image-rendering: pixelated` for crisp square pixels.
 */
export class Display extends HTMLElement implements DisplayWidget {
  private readonly width = DEFAULT_DISPLAY_CONFIG.width;
  private readonly height = DEFAULT_DISPLAY_CONFIG.height;
  private readonly numX = DEFAULT_DISPLAY_CONFIG.numX;
  private readonly numY = DEFAULT_DISPLAY_CONFIG.numY;
  private readonly pixelSize = this.width / this.numX;
  private readonly palette = DEFAULT_COLOR_PALETTE;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private memory: Memory | null = null;
  private built = false;
  private subscribed = false;

  private readonly onMemoryChanged = (event: MemoryChangedEvent): void => {
    if (event.addr >= DisplayAddressRange.START && event.addr <= DisplayAddressRange.END) {
      this.updatePixel(event.addr);
    }
  };

  connectedCallback(): void {
    this.ensureBuilt();
  }

  // --- DisplayWidget interface ---

  /** Bind the display to memory: subscribe to changes, then paint the current state. */
  public initialize(memory: Memory): void {
    this.ensureBuilt();
    this.memory = memory;
    if (!this.subscribed) {
      this.subscribed = true;
      memory.on("changed", this.onMemoryChanged);
    }
    this.reset();
    this.drawAllPixels();
  }

  /** Paint the whole screen black. */
  public reset(): void {
    if (!this.ctx) return;
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /** Repaint the single cell mapped to `addr`. */
  public updatePixel(addr: number): void {
    if (!this.ctx || !this.memory) return;
    this.ctx.fillStyle = this.palette[this.memory.get(addr) & 0x0f];
    const y = Math.floor((addr - DisplayAddressRange.START) / this.numY);
    const x = (addr - DisplayAddressRange.START) % this.numX;
    this.ctx.fillRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
  }

  /** Repaint every cell from current memory. */
  public drawAllPixels(): void {
    for (let addr = DisplayAddressRange.START; addr <= DisplayAddressRange.END; addr++) {
      this.updatePixel(addr);
    }
  }

  /** Detach the memory subscription (the view's `close()`). */
  public close(): void {
    if (this.subscribed && this.memory) {
      this.memory.off("changed", this.onMemoryChanged);
      this.subscribed = false;
    }
  }

  /** The focusable canvas element (the keyboard target — GNOME's `focusable` display). */
  public get element(): HTMLCanvasElement | null {
    return this.canvas;
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const canvas = document.createElement("canvas");
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.className = "game-console-screen";
    // Focusable so it can receive keyboard input when the user plays (the GNOME
    // twin's `focusable: true` DrawingArea).
    canvas.tabIndex = 0;

    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.replaceChildren(canvas);
    this.reset();
  }
}

customElements.define("learn-display", Display);
