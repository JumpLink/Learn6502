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

  // Flag labels
  declare private _nFlag: Gtk.Label;
  declare private _vFlag: Gtk.Label;
  declare private _dashFlag: Gtk.Label;
  declare private _bFlag: Gtk.Label;
  declare private _dFlag: Gtk.Label;
  declare private _iFlag: Gtk.Label;
  declare private _zFlag: Gtk.Label;
  declare private _cFlag: Gtk.Label;

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
          // flags (compact)
          "nFlag",
          "vFlag",
          "dashFlag",
          "bFlag",
          "dFlag",
          "iFlag",
          "zFlag",
          "cFlag",
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

    // Optional: Klick auf PC öffnet Disassembly/Memory-View
    // (hook hier ein Signal ein, falls du eine Navigation hast)
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

    // Optional: Dezimal im Subtitle für Einsteiger
    this._rowA.set_subtitle(`${regA} (dez)`);
    this._rowX.set_subtitle(`${regX} (dez)`);
    this._rowY.set_subtitle(`${regY} (dez)`);

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

    // Kompakt-Flags visuell hervorheben (aktiv: normal, inaktiv: dim-label)
    const setFlag = (label: Gtk.Label, on: number) => {
      if (on) {
        label.remove_css_class("dim-label");
        label.add_css_class("accent"); // dezent; falls zu kräftig, weglassen
      } else {
        label.add_css_class("dim-label");
        label.remove_css_class("accent");
      }
    };

    setFlag(this._nFlag, bits[0]);
    setFlag(this._vFlag, bits[1]);
    // dash flag nur anzeigen, nicht highlighten
    this._dashFlag.add_css_class("dim-label");

    setFlag(this._bFlag, bits[3]);
    setFlag(this._dFlag, bits[4]);
    setFlag(this._iFlag, bits[5]);
    setFlag(this._zFlag, bits[6]);
    setFlag(this._cFlag, bits[7]);

    // P-Register Bitansicht (Text 0/1)
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
