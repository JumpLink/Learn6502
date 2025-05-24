import { type Memory, DisplayAddressRange } from "@learn6502/6502";
import {
  type DisplayWidget,
  DEFAULT_COLOR_PALETTE,
} from "@learn6502/common-ui";

/**
 * Represents the display for a 6502 emulator.
 */
export class Display implements DisplayWidget {
  private ctx: CanvasRenderingContext2D | null = null;
  private width: number = 160;
  private height: number = 160;
  private pixelSize: number = 0;
  private numX: number = 32;
  private numY: number = 32;

  private palette = DEFAULT_COLOR_PALETTE;

  /**
   * Creates a new Display instance.
   * @param node - The HTML element that will contain the display.
   */
  constructor(
    private readonly node: HTMLElement,
    private readonly memory: Memory
  ) {
    this.memory.on("changed", (event) => {
      if (
        event.addr >= DisplayAddressRange.START &&
        event.addr <= DisplayAddressRange.END
      ) {
        this.updatePixel(event.addr);
      }
    });
  }

  /**
   * Initializes the display by setting up the canvas and context.
   * @throws {Error} If the canvas element is not found.
   */
  public initialize(_memory: Memory): void {
    const canvas = this.node.querySelector<HTMLCanvasElement>(".screen");
    if (!canvas) {
      throw new Error("Canvas not found");
    }
    this.width = canvas.width || 160;
    this.height = canvas.height || 160;
    this.pixelSize = this.width / this.numX;
    this.ctx = canvas.getContext("2d");
    this.reset();
  }

  /**
   * Resets the display to a black screen.
   */
  public reset(): void {
    if (!this.ctx) {
      return;
    }
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   * @param memory - The Memory object containing the pixel data.
   */
  public updatePixel(addr: number): void {
    if (!this.ctx) {
      return;
    }
    this.ctx.fillStyle = this.palette[this.memory.get(addr) & 0x0f];
    const y = Math.floor((addr - DisplayAddressRange.START) / this.numY);
    const x = (addr - DisplayAddressRange.START) % this.numX;
    this.ctx.fillRect(
      x * this.pixelSize,
      y * this.pixelSize,
      this.pixelSize,
      this.pixelSize
    );
  }

  /**
   * Redraws all pixels on the display based on current memory state.
   */
  public drawAllPixels(): void {
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      this.updatePixel(addr);
    }
  }
}
