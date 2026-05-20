import { ContentView, Builder } from "@nativescript/core";
import type { DebugInfoWidget } from "@learn6502/common-ui";
import type { Simulator } from "@learn6502/6502";
import { num2hex, addr2hex } from "@learn6502/6502";
import { ListItem } from "../list-item";
import { logger } from "~/utils";

/**
 * DebugInfo widget displaying 6502 CPU registers and status flags
 * Uses Material Design 3 List and ListItem components for a modern look
 */
export class DebugInfo extends ContentView implements DebugInfoWidget {
  // ListItem references for registers
  private itemA!: ListItem;
  private itemX!: ListItem;
  private itemY!: ListItem;
  private itemSP!: ListItem;
  private itemPC!: ListItem;
  private itemFlags!: ListItem;

  constructor() {
    super();
  }

  public onLoaded(): void {
    super.onLoaded();

    logger.debug("DebugInfo", "onLoaded - loading template");

    // Load the XML layout using Builder
    const componentView = Builder.load({
      path: "~/widgets/debugger",
      name: "debug-info",
    });

    if (!componentView) {
      logger.error("DebugInfo", "Failed to load debug-info.xml template");
      return;
    }

    // Get references to list items from template
    this.itemA = componentView.getViewById<ListItem>("itemA");
    this.itemX = componentView.getViewById<ListItem>("itemX");
    this.itemY = componentView.getViewById<ListItem>("itemY");
    this.itemSP = componentView.getViewById<ListItem>("itemSP");
    this.itemPC = componentView.getViewById<ListItem>("itemPC");
    this.itemFlags = componentView.getViewById<ListItem>("itemFlags");

    if (!this.itemA || !this.itemX || !this.itemY || !this.itemSP || !this.itemPC || !this.itemFlags) {
      logger.error("DebugInfo", "Failed to find list items in template");
    } else {
      logger.debug("DebugInfo", "All list items loaded successfully");
    }

    // Add the componentView to the content
    this.content = componentView;
  }

  public update(simulator: Simulator): void {
    // Get register values from simulator.info
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;

    // Update register values with both hex and decimal representation
    if (this.itemA) {
      this.itemA.trailingText = `$${num2hex(regA)} (${regA})`;
    }
    if (this.itemX) {
      this.itemX.trailingText = `$${num2hex(regX)} (${regX})`;
    }
    if (this.itemY) {
      this.itemY.trailingText = `$${num2hex(regY)} (${regY})`;
    }
    if (this.itemSP) {
      this.itemSP.trailingText = `$${num2hex(regSP)} (${regSP})`;
    }
    if (this.itemPC) {
      this.itemPC.trailingText = `$${addr2hex(regPC)} (${regPC})`;
    }

    // Update flags (N V - B D I Z C format, bits 7-0)
    if (this.itemFlags) {
      let flagsText = "";
      for (let i = 7; i >= 0; i--) {
        flagsText += (regP >> i) & 1;
      }
      this.itemFlags.trailingText = flagsText;
    }
  }
}
