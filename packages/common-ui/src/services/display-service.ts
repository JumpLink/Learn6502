import { type Memory, DisplayAddressRange } from "@learn6502/6502";
import { DEFAULT_COLOR_PALETTE } from "../data/display-constants";
import type { RGBColor } from "../types/display-config";

/**
 * Service for managing the display operations across platforms.
 * Handles pixel mapping, color conversion, and other display-related utilities.
 */
export class DisplayService {
  private _palette: string[];

  constructor(palette = DEFAULT_COLOR_PALETTE) {
    this._palette = palette;
  }

  /**
   * Gets the current color palette
   */
  get palette(): string[] {
    return this._palette;
  }

  /**
   * Sets a new color palette
   */
  set palette(value: string[]) {
    this._palette = value;
  }

  /**
   * Converts a memory address to x,y coordinates
   * @param addr Memory address (0x200-0x5ff)
   * @param numX Number of pixels in x direction
   * @returns [x, y] coordinates
   */
  addrToCoordinates(addr: number, numX: number): [number, number] {
    const offset = addr - DisplayAddressRange.START;
    const y = Math.floor(offset / numX);
    const x = offset % numX;
    return [x, y];
  }

  /**
   * Converts a hex color string to RGB components (0-1 range)
   * @param hex Hex color string (e.g. "#ff0000")
   * @returns RGB components as {red, green, blue} with values 0-1
   */
  hexToRgb(hex: string): RGBColor {
    // Expand shorthand form (e.g. "#03F") to full form (e.g. "#0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (!result) {
      return { red: 0, green: 0, blue: 0 };
    }

    return {
      red: parseInt(result[1], 16) / 255,
      green: parseInt(result[2], 16) / 255,
      blue: parseInt(result[3], 16) / 255,
    };
  }

  /**
   * Gets the color for a specific memory address
   * @param memory Memory object
   * @param addr Memory address
   * @returns RGB color object with values in 0-1 range
   */
  getColorForAddress(memory: Memory, addr: number): RGBColor {
    const value = memory.get(addr) & 0x0f;
    const hex = this._palette[value];
    return this.hexToRgb(hex);
  }

  /**
   * Determines if a memory address corresponds to a display pixel
   * @param addr Memory address to check
   * @returns True if address is in display range (0x200-0x5ff)
   */
  isDisplayAddress(addr: number): boolean {
    return addr >= DisplayAddressRange.START && addr <= DisplayAddressRange.END;
  }
}
