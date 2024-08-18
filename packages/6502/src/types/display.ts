export type Display = {
  /**
   * Initializes the display.
   */
  initialize(): void

  /**
   * Resets the display to a black screen.
   */
  reset(): void

  /**
   * Updates a single pixel on the display.
   * @param addr - The memory address of the pixel.
   * @param memory - The Memory object containing the pixel data.
   */
  updatePixel(addr: number): void
}