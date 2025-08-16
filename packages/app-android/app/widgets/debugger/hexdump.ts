import { TextView } from "@nativescript/core";
import type { HexdumpWidget, HexdumpEventMap } from "@learn6502/common-ui";
import type { Assembler } from "@learn6502/6502";
import { EventDispatcher } from "@learn6502/6502";

export class Hexdump extends TextView implements HexdumpWidget {
  readonly events = new EventDispatcher<HexdumpEventMap>();

  constructor() {
    super();

    // Add tap gesture for copying
    this.on("tap", () => {
      if (this.text) {
        this.events.dispatch("copy", { content: this.text });
      }
    });
  }

  public update(assembler: Assembler): void {
    this.text = assembler.hexdump({
      includeAddress: false,
      includeSpaces: true,
      includeNewline: true,
    });
  }
}
