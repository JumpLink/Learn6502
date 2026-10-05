import { type Memory, DisplayAddressRange, hexToRgb } from "@learn6502/core";
import { DEFAULT_COLOR_PALETTE } from "../data/index.ts";
import type { RGBColor } from "../types/index.ts";

/**
 * Service containing platform-independent business logic for game console state management
 * Handles display rendering, color palettes, and pixel calculations
 */
export class GameConsoleStateService {
  // State tracking
  private _colorPalette: string[] = DEFAULT_COLOR_PALETTE;

  /**
   * Get the current color palette
   */
  public get colorPalette(): string[] {
    return [...this._colorPalette];
  }

  /**
   * Set a new color palette
   */
  public set colorPalette(value: string[]) {
    this._colorPalette = [...value];
  }

  /**
   * Get the color for a specific memory address
   * @param memory Memory instance
   * @param addr Memory address
   * @returns RGB color object with values in 0-1 range
   */
  public getColorForAddress(memory: Memory, addr: number): RGBColor {
    try {
      const value = memory.get(addr) & 0x0f;
      const hex = this._colorPalette[value];
      return hexToRgb(hex);
    } catch (error) {
      console.error(`Error getting color for address 0x${addr.toString(16)}: ${error}`);
      // Return fallback color
      return { red: 1, green: 0, blue: 1 }; // Magenta to indicate error
    }
  }

  /**
   * Convert a memory address to pixel coordinates
   * @param addr Memory address (0x200-0x5ff)
   * @param numX Number of pixels in x direction
   * @returns [x, y] coordinates
   */
  public addrToCoordinates(addr: number, numX: number): [number, number] {
    if (!this.isDisplayAddress(addr)) {
      console.error(`Invalid display address: 0x${addr.toString(16)}`);
      return [0, 0]; // Return default coordinates
    }

    try {
      const offset = addr - DisplayAddressRange.START;
      const y = Math.floor(offset / numX);
      const x = offset % numX;
      return [x, y];
    } catch (error) {
      console.error(`Error converting address to coordinates: ${error}`);
      return [0, 0];
    }
  }

  /**
   * Check if an address is in the display memory range
   * @param addr Memory address to check
   * @returns True if address is in display range (0x200-0x5ff)
   */
  public isDisplayAddress(addr: number): boolean {
    return addr >= DisplayAddressRange.START && addr <= DisplayAddressRange.END;
  }

  /**
   * Initialize memory with test patterns to verify display functionality
   * @param memory Memory instance to initialize
   * @param pattern The pattern type to initialize
   */
  public initializeMemoryWithTestPattern(
    memory: Memory,
    pattern: "gradient" | "colorChart" | "simple" = "simple"
  ): void {
    console.log(`GameConsoleStateService: Initializing memory with '${pattern}' test pattern`);

    switch (pattern) {
      case "gradient":
        this.initializeGradientPattern(memory);
        break;
      case "colorChart":
        this.initializeColorChartPattern(memory);
        break;
      case "simple":
      default:
        this.initializeSimplePattern(memory);
        break;
    }
  }

  /**
   * Initialize a simple test pattern with a color gradient
   * @param memory Memory instance
   */
  private initializeSimplePattern(memory: Memory): void {
    // Make sure the display area is clear
    for (let addr = DisplayAddressRange.START; addr <= DisplayAddressRange.END; addr++) {
      memory.set(addr, 0);
    }

    // Add a simple pattern
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const addr = DisplayAddressRange.START + y * 32 + x;
        const color = (x + y) % 16;
        memory.set(addr, color);
      }
    }
  }

  /**
   * Initialize a gradient pattern
   * @param memory Memory instance
   */
  private initializeGradientPattern(memory: Memory): void {
    for (let addr = DisplayAddressRange.START; addr <= DisplayAddressRange.END; addr++) {
      const offset = addr - DisplayAddressRange.START;
      const value = Math.floor((offset / (DisplayAddressRange.END - DisplayAddressRange.START)) * 16);
      memory.set(addr, value & 0x0f);
    }
  }

  /**
   * Initialize a color chart pattern
   * @param memory Memory instance
   */
  private initializeColorChartPattern(memory: Memory): void {
    let addr = DisplayAddressRange.START;
    for (let color = 0; color < 16; color++) {
      for (let i = 0; i < 128; i++) {
        // 128 pixels per color
        if (addr <= DisplayAddressRange.END) {
          memory.set(addr, color);
          addr++;
        }
      }
    }
  }

  /**
   * Render a frame from memory to RGB color array
   * @param memory Memory instance
   * @param width Display width in pixels
   * @param height Display height in pixels
   * @returns 2D array of RGB colors
   */
  public renderFrame(memory: Memory, width: number, height: number): RGBColor[][] {
    const frame: RGBColor[][] = [];

    for (let y = 0; y < height; y++) {
      frame[y] = [];
      for (let x = 0; x < width; x++) {
        const addr = DisplayAddressRange.START + y * width + x;
        if (this.isDisplayAddress(addr)) {
          frame[y][x] = this.getColorForAddress(memory, addr);
        } else {
          frame[y][x] = { red: 0, green: 0, blue: 0 };
        }
      }
    }

    return frame;
  }
}

// Export singleton instance
export const gameConsoleStateService = new GameConsoleStateService();
