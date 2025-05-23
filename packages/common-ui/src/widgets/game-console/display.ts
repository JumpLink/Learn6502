import type { Memory } from "@learn6502/6502";

/**
 * Interface for display widgets across different platforms
 */
export interface DisplayWidget {
  /**
   * Initializes the display with memory access.
   * @param memory The memory to display
   */
  initialize(memory: Memory): void;

  /**
   * Resets the display to a black screen.
   */
  reset(): void;

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   */
  updatePixel(addr: number): void;

  /**
   * Force redraw of all pixels on the display.
   */
  drawAllPixels(): void;
}
