import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import { SourceView } from "../source-view.ts";

import { type Assembler, EventDispatcher } from "@learn6502/6502";
import type {
  DisassembledEventMap,
  DisassembledWidget,
  SourceViewCopyEvent,
} from "@learn6502/common-ui";

import Template from "./disassembled.blp";

export class Disassembled extends Adw.Bin implements DisassembledWidget {
  readonly events: EventDispatcher<DisassembledEventMap> =
    new EventDispatcher<DisassembledEventMap>();

  // Child widgets
  declare private _sourceView: SourceView;

  static {
    GObject.registerClass(
      {
        GTypeName: "Disassembled",
        Template,
        InternalChildren: ["sourceView"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    this.onCopy = this.onCopy.bind(this);

    this._sourceView.events.on("copy", this.onCopy);
  }

  public update(assembler: Assembler) {
    const disassembledData = assembler.disassemble();

    // Extract only the assembly instructions (opCode + formattedArgs)
    const assemblyCode = disassembledData.instructions
      .map((inst) => `${inst.opCode} ${inst.formattedArgs}`)
      .join("\n");

    this._sourceView.buffer.text = assemblyCode;
  }

  private onCopy(event: SourceViewCopyEvent) {
    this.events.dispatch("copy", event);
  }

  public clear(): void {
    this._sourceView.buffer.text = "";
  }
}

GObject.type_ensure(Disassembled.$gtype);
