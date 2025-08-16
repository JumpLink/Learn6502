import GObject from "@girs/gobject-2.0";
import GtkSource from "@girs/gtksource-5";
import GLib from "@girs/glib-2.0";

import { GutterRendererMode } from "./types/index.ts";

export namespace GutterRendererLineNumbers {
  export interface ConstructorProps
    extends GtkSource.GutterRendererText.ConstructorProps {
    startValue?: number;
    mode?: GutterRendererMode;
  }
}

/**
 * A gutter renderer that displays the address of the line in the hex monitor
 * or normal line numbers with custom starting value.
 */
export class GutterRendererLineNumbers extends GtkSource.GutterRendererText {
  static {
    GObject.registerClass(
      {
        GTypeName: "GutterRendererLineNumbers",
        Properties: {
          startValue: GObject.ParamSpec.uint(
            "start-value",
            "Start Value",
            "The starting value for line numbers",
            GObject.ParamFlags.READWRITE,
            0,
            GLib.MAXUINT32,
            1
          ),
          mode: GObject.ParamSpec.string(
            "mode",
            "Mode",
            "Display mode (normal or hex)",
            GObject.ParamFlags.READWRITE,
            GutterRendererMode.HEX
          ),
        },
      },
      this
    );
  }

  private _startValue: number = 1;
  private _mode: GutterRendererMode = GutterRendererMode.HEX;

  constructor(
    params: Partial<GutterRendererLineNumbers.ConstructorProps> = {}
  ) {
    const { startValue, mode, ...rest } = params;
    super(rest);
    this.mode = mode || GutterRendererMode.HEX;
    this.startValue =
      startValue !== undefined
        ? startValue
        : this.mode === GutterRendererMode.HEX
          ? 0x0000
          : 1;
  }

  /**
   * Get the start value for line numbering
   */
  get startValue(): number {
    return this._startValue;
  }

  /**
   * Set the start value for line numbering
   */
  set startValue(value: number) {
    if (this._startValue !== value) {
      this._startValue = value;
      this.queue_draw();
    }
  }

  /**
   * Get the display mode
   */
  get mode(): GutterRendererMode {
    return this._mode;
  }

  /**
   * Set the display mode
   */
  set mode(value: GutterRendererMode) {
    if (this._mode !== value) {
      this._mode = value;
      this.queue_draw();
    }
  }

  /**
   * Called by GtkSourceView to query the text to display
   */
  public vfunc_query_data(gutter: GtkSource.GutterLines, line: number): void {
    if (this._mode === GutterRendererMode.HEX) {
      // In hex mode, calculate address based on startValue and line
      // For 6502 programs, startValue is usually 0x0600 (1536 dec)
      const baseAddress = this._startValue;
      const address = baseAddress + line * 16;

      const formattedAddress = address
        .toString(16)
        .padStart(4, "0")
        .toUpperCase();
      this.text = formattedAddress;
    } else {
      // Normal mode: display regular line numbers with offset
      const adjustedLine = line + this._startValue;
      this.text = adjustedLine.toString();
    }
  }
}
