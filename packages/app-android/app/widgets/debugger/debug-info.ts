import { GridLayout, Label } from "@nativescript/core";
import type { DebugInfoWidget } from "@learn6502/common-ui";
import type { Simulator } from "@learn6502/6502";
import { num2hex, addr2hex } from "@learn6502/6502";

export class DebugInfo extends GridLayout implements DebugInfoWidget {
  private regALabel: Label | null = null;
  private regXLabel: Label | null = null;
  private regYLabel: Label | null = null;
  private regSPLabel: Label | null = null;
  private regPCLabel: Label | null = null;
  private flagsLabel: Label | null = null;

  constructor() {
    super();
  }

  public onLoaded(): void {
    super.onLoaded();

    // Get references to labels from template
    this.regALabel = this.getViewById<Label>("regA");
    this.regXLabel = this.getViewById<Label>("regX");
    this.regYLabel = this.getViewById<Label>("regY");
    this.regSPLabel = this.getViewById<Label>("regSP");
    this.regPCLabel = this.getViewById<Label>("regPC");
    this.flagsLabel = this.getViewById<Label>("flags");
  }

  public update(simulator: Simulator): void {
    // Get register values from simulator.info
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;

    // Update register values
    if (this.regALabel) this.regALabel.text = "$" + num2hex(regA);
    if (this.regXLabel) this.regXLabel.text = "$" + num2hex(regX);
    if (this.regYLabel) this.regYLabel.text = "$" + num2hex(regY);
    if (this.regSPLabel) this.regSPLabel.text = "$" + num2hex(regSP);
    if (this.regPCLabel) this.regPCLabel.text = "$" + addr2hex(regPC);

    // Update flags (NV-BDIZC format)
    if (this.flagsLabel) {
      let flagsText = "";
      for (let i = 7; i >= 0; i--) {
        flagsText += (regP >> i) & 1;
      }
      this.flagsLabel.text = flagsText;
    }
  }
}
