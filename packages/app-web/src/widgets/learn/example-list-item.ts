import type { ExampleMeta } from "@learn6502/examples";
import { DisplayAddressRange, EventDispatcher, Memory } from "@learn6502/core";

import { Display } from "../game-console/display.js";
import { SourceView } from "../editor/source-view.js";

/** Events emitted by an example list item. */
interface ExampleListItemEventMap {
  copy: { code: string };
}

/**
 * ExampleListItem — one entry in the Learn view's Examples list.
 *
 * Web twin of app-gnome's `ExampleListItem extends Gtk.Box`
 * (`example-list-item.blp`): a card with the example's memory-snapshot
 * thumbnail (reusing the GameConsole `Display`), its title/author/description,
 * and the source code in a read-only `SourceView` whose copy button loads the
 * program into the editor. Mirrors the GNOME item's `copy-code` signal via the
 * shared `EventDispatcher`.
 *
 * @emits copy - when the source view's copy button is pressed
 */
export class ExampleListItem extends HTMLElement {
  readonly events: EventDispatcher<ExampleListItemEventMap> = new EventDispatcher<ExampleListItemEventMap>();

  private readonly thumbnail = new Display();
  private readonly sourceView = new SourceView();
  private example: ExampleMeta | null = null;
  private built = false;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  /** Bind an example: fill the text, load the code, paint the thumbnail. */
  public setExample(example: ExampleMeta): void {
    this.ensureBuilt();
    this.example = example;

    const title = this.querySelector<HTMLElement>(".example-title");
    const author = this.querySelector<HTMLElement>(".example-author");
    const description = this.querySelector<HTMLElement>(".example-description");
    if (title) title.textContent = example.title;
    if (author) author.textContent = `by ${example.author}`;
    if (description) description.textContent = example.description;

    this.sourceView.code = example.code;
    this.paintThumbnail(example.displayMemory);
  }

  /**
   * Paint the thumbnail from the example's display-memory hex snapshot — the
   * same 2-hex-chars-per-byte parse app-gnome's `ExampleListItem` uses.
   */
  private paintThumbnail(displayMemoryHex: string): void {
    const memory = new Memory();
    let addr = DisplayAddressRange.START;
    for (let i = 0; i < displayMemoryHex.length && addr <= DisplayAddressRange.END; i += 2) {
      const value = parseInt(displayMemoryHex.substring(i, i + 2), 16);
      if (!Number.isNaN(value)) {
        memory.set(addr, value);
        addr++;
      }
    }
    this.thumbnail.initialize(memory);
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    const header = document.createElement("div");
    header.className = "example-header";

    this.thumbnail.classList.add("example-thumbnail");

    const text = document.createElement("div");
    text.className = "example-text";
    const title = document.createElement("span");
    title.className = "example-title title-4";
    const author = document.createElement("span");
    author.className = "example-author dim-label";
    const description = document.createElement("span");
    description.className = "example-description body";
    text.append(title, author, description);

    header.append(this.thumbnail, text);

    // Read-only, copyable source view — the copy button loads it into the editor.
    // Size to content (capped in CSS) rather than filling like the main editor.
    this.sourceView.classList.add("example-source-view");
    this.sourceView.editable = false;
    this.sourceView.copyable = true;
    this.sourceView.fillHeight = false;
    this.sourceView.events.on("copy", (event) => this.events.dispatch("copy", { code: event.code }));

    this.replaceChildren(header, this.sourceView);
  }
}

customElements.define("learn-example-list-item", ExampleListItem);
