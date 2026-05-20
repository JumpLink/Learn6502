import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { type Simulator, num2hex, addr2hex } from "@learn6502/6502";
import { type DebugInfoWidget } from "@learn6502/common-ui";
import Template from "./debug-info.blp";

export class DebugInfo extends Adw.Bin implements DebugInfoWidget {
  // Register value labels (hex)
  private declare _aValue: Gtk.Label;
  private declare _xValue: Gtk.Label;
  private declare _yValue: Gtk.Label;
  private declare _spValue: Gtk.Label;
  private declare _pcValue: Gtk.Label;

  // Register value labels (decimal)
  private declare _aValueDec: Gtk.Label;
  private declare _xValueDec: Gtk.Label;
  private declare _yValueDec: Gtk.Label;
  private declare _spValueDec: Gtk.Label;
  private declare _pcValueDec: Gtk.Label;

  // Register rows (for help subtitles)
  private declare _rowA: Adw.ActionRow;
  private declare _rowX: Adw.ActionRow;
  private declare _rowY: Adw.ActionRow;
  private declare _rowSP: Adw.ActionRow;
  private declare _rowPC: Adw.ActionRow;

  // P bits (bit7..bit0)
  private declare _p7: Gtk.Label;
  private declare _p6: Gtk.Label;
  private declare _p5: Gtk.Label;
  private declare _p4: Gtk.Label;
  private declare _p3: Gtk.Label;
  private declare _p2: Gtk.Label;
  private declare _p1: Gtk.Label;
  private declare _p0: Gtk.Label;

  static {
    GObject.registerClass(
      {
        GTypeName: "DebugInfo",
        Template,
        InternalChildren: [
          // register rows (for subtitles)
          "rowA",
          "rowX",
          "rowY",
          "rowSP",
          "rowPC",
          // register values (hex)
          "aValue",
          "xValue",
          "yValue",
          "spValue",
          "pcValue",
          // register values (decimal)
          "aValueDec",
          "xValueDec",
          "yValueDec",
          "spValueDec",
          "pcValueDec",
          // bit view p7..p0
          "p7",
          "p6",
          "p5",
          "p4",
          "p3",
          "p2",
          "p1",
          "p0",
        ],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

    // Optional: Click on PC opens Disassembly/Memory-View
    // (hook up a signal here if you have navigation)
    // this._pcValue.connect("activate-link", ...);
  }

  public update(simulator: Simulator) {
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;

    // Register values (hex)
    this._aValue.set_label(`$${num2hex(regA)}`);
    this._xValue.set_label(`$${num2hex(regX)}`);
    this._yValue.set_label(`$${num2hex(regY)}`);
    this._spValue.set_label(`$${num2hex(regSP)}`);
    this._pcValue.set_label(`$${addr2hex(regPC)}`);

    // Register values (decimal) - always visible
    this._aValueDec.set_label(`${regA}`);
    this._xValueDec.set_label(`${regX}`);
    this._yValueDec.set_label(`${regY}`);
    this._spValueDec.set_label(`${regSP}`);
    this._pcValueDec.set_label(`${regPC}`);

    // Flags: N V - B D I Z C   (bit7..bit0)
    // 6502 P: N V - B D I Z C
    const bits = [
      (regP >> 7) & 1, // N
      (regP >> 6) & 1, // V
      (regP >> 5) & 1, // -
      (regP >> 4) & 1, // B
      (regP >> 3) & 1, // D
      (regP >> 2) & 1, // I
      (regP >> 1) & 1, // Z
      (regP >> 0) & 1, // C
    ];

    // Update compact flag display (bit view)
    const pLbls = [this._p7, this._p6, this._p5, this._p4, this._p3, this._p2, this._p1, this._p0];
    pLbls.forEach((lbl, i) => {
      const v = bits[i];
      lbl.set_label(v ? "1" : "0");
      if (v) lbl.remove_css_class("dim-label");
      else lbl.add_css_class("dim-label");
    });
  }
}

GObject.type_ensure(DebugInfo.$gtype);
