import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import { DEFAULT_COLOR_PALETTE, DEFAULT_DISPLAY_CONFIG, type DisplayWidget } from "@learn6502/common-ui";
import { DisplayAddressRange, type Memory, type MemoryChangedEvent } from "@learn6502/core";

import { Canvas2DBridge } from "./canvas2d.ts";
import Template from "./display.blp?template";

type Bridge = InstanceType<typeof Canvas2DBridge>;

// The bridge registers its GType on import; holding the class keeps that import from being tree-shaken.
// fixed upstream in gjsify: @gjsify/canvas2d now lists canvas2d-bridge.js in sideEffects (#2210); drop this once pinned.
const keptBridges: unknown[] = [];
const keepBridge = (bridge: unknown): void => {
  keptBridges.push(bridge);
};

/**
 * The 6502 console screen: a `Canvas2DBridge` painted with `fillRect`, the
 * same widget on GNOME, web and Android. The canvas matches the allocation, so
 * the cell size is derived from it on every paint (thumbnails are 80 wide).
 */
export class Display extends Adw.Bin implements DisplayWidget {
  declare private _canvas: Bridge;
  declare private _displayWidth: number;
  declare private _displayHeight: number;

  private readonly numX = DEFAULT_DISPLAY_CONFIG.numX;
  private readonly numY = DEFAULT_DISPLAY_CONFIG.numY;
  private memory: Memory | undefined;

  private readonly onMemoryChanged = (event: MemoryChangedEvent): void => {
    if (event.addr >= DisplayAddressRange.START && event.addr <= DisplayAddressRange.END) {
      this.updatePixel(event.addr);
    }
  };

  static {
    keepBridge(Canvas2DBridge);
    GObject.registerClass(
      {
        GTypeName: "Display",
        Template,
        InternalChildren: ["canvas"],
        Properties: {
          displayWidth: GObject.ParamSpec.int(
            "display-width",
            "Display Width",
            "Width of the display in pixels",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            1,
            2048,
            DEFAULT_DISPLAY_CONFIG.width
          ),
          displayHeight: GObject.ParamSpec.int(
            "display-height",
            "Display Height",
            "Height of the display in pixels",
            GObject.ParamFlags.READWRITE | GObject.ParamFlags.CONSTRUCT,
            1,
            2048,
            DEFAULT_DISPLAY_CONFIG.height
          ),
        },
      },
      this
    );
  }

  public get displayWidth(): number {
    return this._displayWidth;
  }

  public set displayWidth(value: number) {
    if (value === this._displayWidth) return;
    this._displayWidth = value;
    this.updateContentSize();
  }

  public get displayHeight(): number {
    return this._displayHeight;
  }

  public set displayHeight(value: number) {
    if (value === this._displayHeight) return;
    this._displayHeight = value;
    this.updateContentSize();
  }

  /** The drawing surface, for platform code that wires focus or key events. */
  public get canvas(): Bridge {
    return this._canvas;
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> & { displayWidth?: number; displayHeight?: number } = {}) {
    super(params);
    this.updateContentSize();
    // A resize clears the canvas, so every size change repaints.
    this._canvas.onResize(() => {
      this.drawAll();
    });
    this._canvas.onReady(() => {
      this.drawAll();
    });
  }

  private updateContentSize(): void {
    if (!this._canvas || !this._displayWidth || !this._displayHeight) return;
    this._canvas.contentWidth = this._displayWidth;
    this._canvas.contentHeight = this._displayHeight;
  }

  /** Bind the display to memory and paint its current state. */
  public initialize(memory: Memory): void {
    this.unbind();
    this.memory = memory;
    memory.on("changed", this.onMemoryChanged);
    this.drawAll();
  }

  /** Stop listening to memory; the Display outlives a program run. */
  public unbind(): void {
    this.memory?.off("changed", this.onMemoryChanged);
  }

  /** Paint the whole screen black. */
  public reset(): void {
    const surface = this.surface();
    if (!surface) return;
    surface.ctx.fillStyle = "black";
    surface.ctx.fillRect(0, 0, surface.width, surface.height);
    this._canvas.queue_draw();
  }

  /** Repaint the cell mapped to `addr`. */
  public updatePixel(addr: number): void {
    const surface = this.surface();
    if (!surface || !this.memory) return;
    this.fillCell(surface, addr, this.memory);
    this._canvas.queue_draw();
  }

  /** Repaint every cell from current memory. */
  public drawAllPixels(): void {
    this.drawAll();
  }

  /** Focus the display to capture keyboard input in desktop mode. */
  public focus(): boolean {
    return this._canvas.grab_focus();
  }

  private drawAll(): void {
    const surface = this.surface();
    if (!surface) return;
    surface.ctx.fillStyle = "black";
    surface.ctx.fillRect(0, 0, surface.width, surface.height);
    if (this.memory) {
      for (let addr = DisplayAddressRange.START; addr <= DisplayAddressRange.END; addr++) {
        this.fillCell(surface, addr, this.memory);
      }
    }
    this._canvas.queue_draw();
  }

  private surface() {
    const canvas = this._canvas?.canvas;
    const ctx = this._canvas?.getContext("2d");
    if (!canvas || !ctx || !canvas.width || !canvas.height) return null;
    return { ctx, width: canvas.width, height: canvas.height };
  }

  private fillCell(surface: NonNullable<ReturnType<Display["surface"]>>, addr: number, memory: Memory): void {
    const cellW = surface.width / this.numX;
    const cellH = surface.height / this.numY;
    const index = addr - DisplayAddressRange.START;
    surface.ctx.fillStyle = DEFAULT_COLOR_PALETTE[memory.get(addr) & 0x0f];
    surface.ctx.fillRect((index % this.numX) * cellW, Math.floor(index / this.numX) * cellH, cellW, cellH);
  }
}

GObject.type_ensure(Display.$gtype);
