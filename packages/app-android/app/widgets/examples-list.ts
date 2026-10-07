import { Gtk } from "@gjsify/adwaita-nativescript";
import { buildInto } from "@gjsify/adwaita-nativescript/builder";
import * as Examples from "@learn6502/examples/examples";
import type { ExampleMeta } from "@learn6502/examples";
// The GNOME app's own Blueprint: a vertical box the examples are appended to.
import examplesListTree from "../../../app-gnome/src/widgets/examples-list.blp?shared-tree";
import { translate } from "~/utils/translate";
import { asView } from "~/utils/as-view";
import { ExampleListItem } from "./example-list-item";

/** The GNOME app's `$ExamplesList`: one card per example; `onCopy` fires with the code of the one copied. */
export class ExamplesList extends Gtk.Box {
  public onCopy: ((code: string) => void) | null = null;

  constructor() {
    super();
    buildInto(this, examplesListTree, { translate });
    for (const example of Object.values(Examples) as ExampleMeta[]) {
      const item = new ExampleListItem(example);
      item.onCopy = (code) => this.onCopy?.(code);
      this.append(asView(item));
    }
  }
}
