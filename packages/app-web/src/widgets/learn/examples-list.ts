import * as Examples from "@learn6502/examples/examples";
import type { ExampleMeta } from "@learn6502/examples";
import { EventDispatcher } from "@learn6502/core";

import { ExampleListItem } from "./example-list-item.js";

/** Events emitted by the examples list. */
interface ExamplesListEventMap {
  copy: { code: string };
}

/**
 * ExamplesList — the Learn view's Examples page content.
 *
 * Web twin of app-gnome's `ExamplesList extends Gtk.Box` (`examples-list.blp`):
 * one `ExampleListItem` per bundled example (`@learn6502/examples`), forwarding
 * each item's copy to a single `copy` event the Learn view routes to
 * `learnController` (which loads the code into the editor).
 *
 * @emits copy - when any example's code is copied to the editor
 */
export class ExamplesList extends HTMLElement {
  readonly events: EventDispatcher<ExamplesListEventMap> = new EventDispatcher<ExamplesListEventMap>();

  private readonly examples: ExampleMeta[] = Object.values(Examples);
  private built = false;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  private ensureBuilt(): void {
    if (this.built) return;
    this.built = true;

    for (const example of this.examples) {
      const item = new ExampleListItem();
      item.setExample(example);
      item.events.on("copy", (event) => this.events.dispatch("copy", { code: event.code }));
      this.appendChild(item);
    }
  }
}

customElements.define("learn-examples-list", ExamplesList);
