import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import { type Simulator, num2hex, addr2hex } from "@learn6502/6502";
import { type DebugInfoWidget } from "@learn6502/common-ui";
import Template from "./debug-info.blp";

export class DebugInfo extends Adw.Bin implements DebugInfoWidget {
  // Register value labels
  declare private _aValue: Gtk.Label;
  declare private _xValue: Gtk.Label;
  declare private _yValue: Gtk.Label;
  declare private _spValue: Gtk.Label;
  declare private _pcValue: Gtk.Label;

  // Optional subtitles for decimal view
  declare private _rowA: Adw.ActionRow;
  declare private _rowX: Adw.ActionRow;
  declare private _rowY: Adw.ActionRow;

  // Flag header labels
  declare private _nHdr: Gtk.Label;
  declare private _vHdr: Gtk.Label;
  declare private _dashHdr: Gtk.Label;
  declare private _bHdr: Gtk.Label;
  declare private _dHdr: Gtk.Label;
  declare private _iHdr: Gtk.Label;
  declare private _zHdr: Gtk.Label;
  declare private _cHdr: Gtk.Label;

  // P bits (bit7..bit0)
  declare private _p7: Gtk.Label;
  declare private _p6: Gtk.Label;
  declare private _p5: Gtk.Label;
  declare private _p4: Gtk.Label;
  declare private _p3: Gtk.Label;
  declare private _p2: Gtk.Label;
  declare private _p1: Gtk.Label;
  declare private _p0: Gtk.Label;

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
          // register values
          "aValue",
          "xValue",
          "yValue",
          "spValue",
          "pcValue",
          // flags header
          "nHdr",
          "vHdr",
          "dashHdr",
          "bHdr",
          "dHdr",
          "iHdr",
          "zHdr",
          "cHdr",
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

    // Registerwerte (hex)
    this._aValue.set_label(`$${num2hex(regA)}`);
    this._xValue.set_label(`$${num2hex(regX)}`);
    this._yValue.set_label(`$${num2hex(regY)}`);
    this._spValue.set_label(`$${num2hex(regSP)}`);
    this._pcValue.set_label(`$${addr2hex(regPC)}`);

    // Optional: Decimal in subtitle for beginners
    this._rowA.set_subtitle(`${regA} (dec)`);
    this._rowX.set_subtitle(`${regX} (dec)`);
    this._rowY.set_subtitle(`${regY} (dec)`);

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

    // Highlight compact flags visually (active: normal, inactive: dim-label)
    const setFlag = (label: Gtk.Label, on: number) => {
      if (on) {
        label.remove_css_class("dim-label");
        label.add_css_class("accent"); // subtle; remove if too strong
      } else {
        label.add_css_class("dim-label");
        label.remove_css_class("accent");
      }
    };

    // Header labels remain static (just labels)
    // Bit labels show the dynamic values
    // dash flag always dimmed
    this._dashHdr.add_css_class("dim-label");

    // P-Register bit view (text 0/1)
    const pLbls = [
      this._p7,
      this._p6,
      this._p5,
      this._p4,
      this._p3,
      this._p2,
      this._p1,
      this._p0,
    ];
    pLbls.forEach((lbl, i) => {
      const v = bits[i];
      lbl.set_label(v ? "1" : "0");
      if (v) lbl.remove_css_class("dim-label");
      else lbl.add_css_class("dim-label");
    });
  }
}

GObject.type_ensure(DebugInfo.$gtype);
