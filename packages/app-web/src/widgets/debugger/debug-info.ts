import { Adw } from "@gjsify/adwaita-web";
import type { DebugInfoWidget } from "@learn6502/common-ui";
import type { Simulator } from "@learn6502/core";
import { addr2hex, num2hex } from "@learn6502/core";

/** A register row's two value labels (hex on top, decimal dim below). */
interface RegisterValue {
  hex: HTMLSpanElement;
  dec: HTMLSpanElement;
}

/**
 * DebugInfo — 6502 CPU registers and the status-flag bits, rendered as Adwaita
 * boxed lists (`<adw-preferences-group>` + `<adw-action-row>`) to match the
 * GNOME debugger (`debug-info.blp`) and its NativeScript twin: a "Registers"
 * group with five rows (A/X/Y/SP/PC, each showing `$hex` over a dim decimal),
 * and a "Status Flags" group whose single row carries the N V - B D I Z C bit
 * display in its suffix.
 */
export class DebugInfo extends HTMLElement implements DebugInfoWidget {
  private registers: Map<string, RegisterValue> | null = null;

  /** Bit labels p7..p0 (N V - B D I Z C), dimmed when the bit is 0. */
  private bitLabels: HTMLSpanElement[] = [];

  connectedCallback(): void {
    this.ensureBuilt();
  }

  public update(simulator: Simulator): void {
    this.ensureBuilt();
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;

    this.setValue("A", `$${num2hex(regA)}`, regA);
    this.setValue("X", `$${num2hex(regX)}`, regX);
    this.setValue("Y", `$${num2hex(regY)}`, regY);
    this.setValue("SP", `$${num2hex(regSP)}`, regSP);
    this.setValue("PC", `$${addr2hex(regPC)}`, regPC);

    // Flags N V - B D I Z C (bit7..bit0); dim a bit when it is 0.
    for (let i = 0; i < 8; i++) {
      const value = (regP >> (7 - i)) & 1;
      const label = this.bitLabels[i];
      label.textContent = value ? "1" : "0";
      label.classList.toggle("learn-flag-off", value === 0);
    }
  }

  private ensureBuilt(): void {
    if (this.registers) return;
    this.registers = new Map();

    const registers = new Adw.PreferencesGroup();
    registers.setAttribute("title", "Registers");

    this.addRegisterRow(registers, "A", "Accumulator: Main register for calculations");
    this.addRegisterRow(registers, "X", "Index register X: Used for addressing");
    this.addRegisterRow(registers, "Y", "Index register Y: Used for addressing");
    this.addRegisterRow(registers, "SP", "Stack Pointer: Points to stack position");
    this.addRegisterRow(registers, "PC", "Program Counter: Points to next instruction");

    const flags = new Adw.PreferencesGroup();
    flags.setAttribute("title", "Status Flags");

    const flagsRow = new Adw.ActionRow();
    flagsRow.setAttribute("title", "P (SR)");
    flagsRow.setAttribute("subtitle", "Processor Status Register");
    flagsRow.appendChild(this.buildFlagsGrid());
    flags.appendChild(flagsRow);

    this.replaceChildren(registers, flags);
  }

  /** Add an `<adw-action-row>` for a register and remember its value labels. */
  private addRegisterRow(group: Adw.PreferencesGroup, name: string, subtitle: string): void {
    const row = new Adw.ActionRow();
    row.setAttribute("title", name);
    row.setAttribute("subtitle", subtitle);

    const box = document.createElement("div");
    box.setAttribute("slot", "suffix");
    box.className = "learn-register-value";

    const hex = document.createElement("span");
    hex.textContent = "$00";

    const dec = document.createElement("span");
    dec.className = "learn-register-dec";
    dec.textContent = "0";

    box.append(hex, dec);
    row.appendChild(box);

    group.appendChild(row);
    this.registers?.set(name, { hex, dec });
  }

  /** The compact N V - B D I Z C header + bit display shown in the flags row suffix. */
  private buildFlagsGrid(): HTMLDivElement {
    const grid = document.createElement("div");
    grid.setAttribute("slot", "suffix");
    grid.className = "learn-flags-grid";

    const headers = ["N", "V", "-", "B", "D", "I", "Z", "C"];
    for (const text of headers) {
      const header = document.createElement("span");
      header.className = "learn-flag-header";
      header.textContent = text;
      grid.appendChild(header);
    }

    this.bitLabels = [];
    for (let col = 0; col < 8; col++) {
      const bit = document.createElement("span");
      bit.textContent = "0";
      bit.classList.add("learn-flag-off");
      grid.appendChild(bit);
      this.bitLabels.push(bit);
    }

    return grid;
  }

  private setValue(name: string, hex: string, dec: number): void {
    const target = this.registers?.get(name);
    if (!target) return;
    target.hex.textContent = hex;
    target.dec.textContent = `${dec}`;
  }
}

customElements.define("learn-debug-info", DebugInfo);
