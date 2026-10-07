import { Gtk } from "@gjsify/adwaita-nativescript";
import { buildInto } from "@gjsify/adwaita-nativescript/builder";
import { localize as _ } from "@nativescript/localize";
import { DisplayAddressRange, Memory } from "@learn6502/core";
import type { ExampleMeta } from "@learn6502/examples";
// The GNOME app's own Blueprint: a card with title, author, description, thumbnail and code preview.
import exampleListItemTree from "../../../app-gnome/src/widgets/example-list-item.blp?shared-tree";
import { translate } from "~/utils/translate";
import type { Display } from "./game-console/display";
import "./game-console/display";
import type { SourceView } from "./source-view";
import "./source-view";

/** The GNOME app's `$ExampleListItem`; `onCopy` fires with the code when its copy button is pressed. */
export class ExampleListItem extends Gtk.Box {
  public onCopy: ((code: string) => void) | null = null;

  constructor(example: ExampleMeta) {
    super();
    buildInto(this, exampleListItemTree, { translate });
    this.getViewById<Gtk.Label>("titleLabel").label = _(example.title);
    this.getViewById<Gtk.Label>("authorLabel").label = _("by %s", example.author);
    this.getViewById<Gtk.Label>("descriptionLabel").label = _(example.description);

    const sourceView = this.getViewById<SourceView>("sourceView");
    sourceView.code = example.code;
    sourceView.events.on("copy", (event) => this.onCopy?.(event.code));

    this.getViewById<Display>("display").initialize(thumbnailMemory(example.displayMemory));
  }
}

/** The example's display snapshot (a hex string over the display range) as a memory. */
function thumbnailMemory(hex: string): Memory {
  const memory = new Memory();
  let address = DisplayAddressRange.START;
  for (let i = 0; i < hex.length && address <= DisplayAddressRange.END; i += 2) {
    const value = parseInt(hex.substring(i, i + 2), 16);
    if (!Number.isNaN(value)) memory.set(address++, value);
  }
  return memory;
}
