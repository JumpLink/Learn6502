import { ContentView, GridLayout, ItemSpec, Label, StackLayout } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import type { DebugInfoWidget } from "@learn6502/common-ui";
import type { Simulator } from "@learn6502/core";
import { num2hex, addr2hex } from "@learn6502/core";
import { Adw } from "@gjsify/adwaita-nativescript";

/** A register row's two value labels (hex on top, decimal dim below). */
interface RegisterValue {
  hex: Label;
  dec: Label;
}

/**
 * DebugInfo — 6502 CPU registers and the status-flag bits, rendered as native
 * Adwaita boxed lists (`Adw.PreferencesGroup` + `Adw.ActionRow`) to match the GNOME
 * debugger (`debug-info.blp`): a "Registers" group with five rows (A/X/Y/SP/PC,
 * each showing `$hex` over a dim decimal), and a "Status Flags" group whose single
 * row carries the N V - B D I Z C bit display in its suffix.
 */
export class DebugInfo extends ContentView implements DebugInfoWidget {
  private readonly regA: RegisterValue;
  private readonly regX: RegisterValue;
  private readonly regY: RegisterValue;
  private readonly regSP: RegisterValue;
  private readonly regPC: RegisterValue;

  /** Bit labels p7..p0 (N V - B D I Z C), dimmed when the bit is 0. */
  private readonly bitLabels: Label[] = [];

  constructor() {
    super();

    const column = new StackLayout();
    column.orientation = "vertical";

    // --- Registers ---
    const registers = new Adw.PreferencesGroup();
    registers.title = _("Registers");
    registers.marginBottom = 12;

    this.regA = this.addRegisterRow(registers, "A", _("Accumulator: Main register for calculations"));
    this.regX = this.addRegisterRow(registers, "X", _("Index register X: Used for addressing"));
    this.regY = this.addRegisterRow(registers, "Y", _("Index register Y: Used for addressing"));
    this.regSP = this.addRegisterRow(registers, "SP", _("Stack Pointer: Points to stack position"));
    this.regPC = this.addRegisterRow(registers, "PC", _("Program Counter: Points to next instruction"));

    column.addChild(registers);

    // --- Status Flags ---
    const flags = new Adw.PreferencesGroup();
    flags.title = _("Status Flags");

    const flagsRow = new Adw.ActionRow();
    flagsRow.title = "P (SR)";
    flagsRow.subtitle = _("Processor Status Register");
    flagsRow.setSuffix(this.buildFlagsGrid());
    flags.addRow(flagsRow);

    column.addChild(flags);

    this.content = column;
  }

  /** Add an `Adw.ActionRow` for a register and return its hex/decimal value labels. */
  private addRegisterRow(group: Adw.PreferencesGroup, name: string, subtitle: string): RegisterValue {
    const row = new Adw.ActionRow();
    row.title = name;
    row.subtitle = subtitle;

    const box = new StackLayout();
    box.orientation = "vertical";
    box.horizontalAlignment = "right";

    const hex = new Label();
    hex.fontFamily = "monospace";
    hex.horizontalAlignment = "right";
    hex.text = "$00";

    const dec = new Label();
    dec.className = "adw-row-subtitle";
    dec.fontFamily = "monospace";
    dec.horizontalAlignment = "right";
    dec.text = "0";

    box.addChild(hex);
    box.addChild(dec);
    row.setSuffix(box);

    group.addRow(row);
    return { hex, dec };
  }

  /** The compact N V - B D I Z C header + bit display shown in the flags row suffix. */
  private buildFlagsGrid(): GridLayout {
    const grid = new GridLayout();
    grid.horizontalAlignment = "right";
    grid.addRow(new ItemSpec(1, "auto"));
    grid.addRow(new ItemSpec(1, "auto"));
    for (let i = 0; i < 8; i++) {
      grid.addColumn(new ItemSpec(1, "auto"));
    }

    const headers = ["N", "V", "-", "B", "D", "I", "Z", "C"];
    headers.forEach((text, col) => {
      const header = new Label();
      header.text = text;
      header.className = "adw-row-subtitle";
      header.width = 16;
      header.horizontalAlignment = "center";
      if (text === "-") header.opacity = 0.4;
      GridLayout.setRow(header, 0);
      GridLayout.setColumn(header, col);
      grid.addChild(header);
    });

    for (let col = 0; col < 8; col++) {
      const bit = new Label();
      bit.text = "0";
      bit.fontFamily = "monospace";
      bit.width = 16;
      bit.horizontalAlignment = "center";
      GridLayout.setRow(bit, 1);
      GridLayout.setColumn(bit, col);
      grid.addChild(bit);
      this.bitLabels.push(bit);
    }

    return grid;
  }

  public update(simulator: Simulator): void {
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;

    this.setValue(this.regA, `$${num2hex(regA)}`, regA);
    this.setValue(this.regX, `$${num2hex(regX)}`, regX);
    this.setValue(this.regY, `$${num2hex(regY)}`, regY);
    this.setValue(this.regSP, `$${num2hex(regSP)}`, regSP);
    this.setValue(this.regPC, `$${addr2hex(regPC)}`, regPC);

    // Flags N V - B D I Z C (bit7..bit0); dim a bit when it is 0.
    for (let i = 0; i < 8; i++) {
      const value = (regP >> (7 - i)) & 1;
      const label = this.bitLabels[i];
      label.text = value ? "1" : "0";
      label.opacity = value ? 1 : 0.4;
    }
  }

  private setValue(target: RegisterValue, hex: string, dec: number): void {
    target.hex.text = hex;
    target.dec.text = `${dec}`;
  }
}
