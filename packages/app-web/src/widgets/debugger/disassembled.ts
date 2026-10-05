import type { DisassembledEventMap, DisassembledWidget } from "@learn6502/common-ui";
import type { Assembler } from "@learn6502/core";
import { EventDispatcher } from "@learn6502/core";
import { buildCodeCard } from "./code-card.js";

/**
 * Disassembled — disassembly of the assembled program.
 *
 * Web twin of app-android's `Disassembled extends TextView` and app-gnome's
 * `disassembled.blp`: a monospace code card whose copy button dispatches the
 * disassembled code (routed to the editor by the controller).
 *
 * @emits copy - when the user copies the disassembled code
 */
export class Disassembled extends HTMLElement implements DisassembledWidget {
  readonly events = new EventDispatcher<DisassembledEventMap>();

  private output: HTMLElement | null = null;
  private lastCode = "";

  connectedCallback(): void {
    this.ensureBuilt();
  }

  public update(assembler: Assembler): void {
    this.ensureBuilt();
    this.lastCode = assembler.disassemble().formatted;
    if (this.output) this.output.textContent = this.lastCode;
  }

  private ensureBuilt(): void {
    if (this.output) return;
    const { card, code, copyButton } = buildCodeCard("Copy to editor");
    this.output = code;
    copyButton.addEventListener("click", () => {
      if (this.lastCode) this.events.dispatch("copy", { code: this.lastCode });
    });
    this.replaceChildren(card);
  }
}

customElements.define("learn-disassembled", Disassembled);
