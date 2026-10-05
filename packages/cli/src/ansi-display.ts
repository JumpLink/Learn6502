import { DEFAULT_COLOR_PALETTE, DEFAULT_DISPLAY_CONFIG, type DisplayWidget } from "@learn6502/common-ui";
import { DisplayAddressRange, type Memory } from "@learn6502/core";

const RESET = "\x1b[0m";

/** Parse an Adwaita palette `#rrggbb` string into an [r, g, b] triple. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

/**
 * AnsiDisplay — the 6502 console screen rendered to a terminal.
 *
 * It implements the SAME `DisplayWidget` interface from `@learn6502/common-ui`
 * that the GTK (`Gtk.DrawingArea` + cairo), web (`<canvas>`) and Android
 * displays implement — the terminal is just another platform. The 32×32 grid of
 * memory `$0200-$05FF` is drawn with the shared 16-entry `DEFAULT_COLOR_PALETTE`
 * as truecolor ANSI. Two vertical pixels share one character cell via the upper
 * half-block `▀` (foreground = top pixel, background = bottom), so the 32×32
 * screen prints as 32 columns × 16 rows and stays roughly square in a terminal.
 */
export class AnsiDisplay implements DisplayWidget {
  private memory: Memory | null = null;
  private readonly numX = DEFAULT_DISPLAY_CONFIG.numX;
  private readonly numY = DEFAULT_DISPLAY_CONFIG.numY;
  private readonly palette = DEFAULT_COLOR_PALETTE.map(hexToRgb);

  // --- DisplayWidget interface ---

  /** Bind to memory. The terminal repaints on demand (see `render`), not per pixel. */
  public initialize(memory: Memory): void {
    this.memory = memory;
  }

  public reset(): void {
    // A terminal frame is produced on demand by `render()`; nothing to clear.
  }

  public updatePixel(_addr: number): void {
    // On-demand rendering reads memory directly; no per-pixel bookkeeping.
  }

  public drawAllPixels(): void {
    // On-demand rendering; the caller decides when to `render()`.
  }

  /** Produce the current display memory as a block of truecolor ANSI half-blocks. */
  public render(): string {
    const memory = this.memory;
    if (!memory) return "";

    const rgbAt = (x: number, y: number): [number, number, number] => {
      const addr = DisplayAddressRange.START + y * this.numX + x;
      return this.palette[memory.get(addr) & 0x0f];
    };

    let out = "";
    for (let y = 0; y < this.numY; y += 2) {
      for (let x = 0; x < this.numX; x++) {
        const [tr, tg, tb] = rgbAt(x, y);
        const [br, bg, bb] = rgbAt(x, y + 1);
        out += `\x1b[38;2;${tr};${tg};${tb}m\x1b[48;2;${br};${bg};${bb}m▀`;
      }
      out += `${RESET}\n`;
    }
    return out;
  }
}
