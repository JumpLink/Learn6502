import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import { SourceView } from "../source-view.ts";

import { type Assembler, EventDispatcher } from "@learn6502/6502";
import { type HexdumpWidget, type HexdumpEventMap } from "@learn6502/common-ui";

import Template from "./hexdump.blp";
export class Hexdump extends Adw.Bin implements HexdumpWidget {
  readonly events: EventDispatcher<HexdumpEventMap> =
    new EventDispatcher<HexdumpEventMap>();

  // Child widgets
  declare private _sourceView: SourceView;

  static {
    GObject.registerClass(
      {
        GTypeName: "Hexdump",
        Template,
        InternalChildren: ["sourceView"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    this._sourceView.connect("copy", this.onCopy.bind(this));
  }

  public update(assembler: Assembler) {
    this._sourceView.buffer.text = assembler.hexdump({
      includeAddress: false,
      includeSpaces: true,
      includeNewline: true,
    });
  }

  private onCopy(_sourceView: SourceView, content: string) {
    // Remove all whitespace
    content = content.replace(/\s/g, "");
    this.events.dispatch("copy", { content });
  }

  public clear(): void {
    this._sourceView.buffer.text = "";
  }
}

GObject.type_ensure(Hexdump.$gtype);
