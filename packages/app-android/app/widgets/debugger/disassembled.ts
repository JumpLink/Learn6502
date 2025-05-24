import { TextView } from "@nativescript/core";
import type {
  DisassembledWidget,
  DisassembledEventMap,
} from "@learn6502/common-ui";
import type { Assembler } from "@learn6502/6502";
import { EventDispatcher } from "@learn6502/6502";

export class Disassembled extends TextView implements DisassembledWidget {
  readonly events = new EventDispatcher<DisassembledEventMap>();

  private fullText: string = "";

  constructor() {
    super();
    this.editable = false;
    this.className =
      "disassembled bg-surface-container text-on-surface font-mono text-xs";
    (this as any).textWrap = true;

    // Add tap gesture for copying
    this.on("tap", () => {
      if (this.fullText) {
        this.events.dispatch("copy", { code: this.fullText });
      }
    });
  }

  public update(assembler: Assembler): void {
    const disassembledData = assembler.disassemble();
    this.fullText = disassembledData.formatted;
    this.text = this.fullText;
  }
}
