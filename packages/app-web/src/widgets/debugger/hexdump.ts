import type { HexdumpEventMap, HexdumpWidget } from "@learn6502/common-ui";
import type { Assembler } from "@learn6502/core";
import { EventDispatcher } from "@learn6502/core";
import { buildCodeCard } from "./code-card.js";

/**
 * Hexdump — hexdump of the assembled program.
 *
 * Web twin of app-android's `Hexdump extends TextView` and app-gnome's
 * `hexdump.blp`: a monospace code card with a copy button.
 *
 * @emits copy - when the user copies the hexdump content
 */
export class Hexdump extends HTMLElement implements HexdumpWidget {
  readonly events = new EventDispatcher<HexdumpEventMap>();

  private output: HTMLElement | null = null;
  private lastContent = "";

  connectedCallback(): void {
    this.ensureBuilt();
  }

  public update(assembler: Assembler): void {
    this.ensureBuilt();
    this.lastContent = assembler.hexdump({
      includeAddress: true,
      includeSpaces: true,
      includeNewline: true,
    });
    if (this.output) this.output.textContent = this.lastContent;
  }

  private ensureBuilt(): void {
    if (this.output) return;
    const { card, code, copyButton } = buildCodeCard("Copy hexdump");
    this.output = code;
    copyButton.addEventListener("click", () => {
      if (this.lastContent) this.events.dispatch("copy", { content: this.lastContent });
    });
    this.replaceChildren(card);
  }
}

customElements.define("learn-hexdump", Hexdump);
