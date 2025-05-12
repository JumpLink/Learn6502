import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import { SourceView } from "../source-view.ts";

import { type Assembler, EventDispatcher } from "@learn6502/6502";
import type {
  DisassembledEventMap,
  DisassembledWidget,
} from "@learn6502/common-ui";

import Template from "./disassembled.blp";

export class Disassembled extends Adw.Bin implements DisassembledWidget {
  // Child widgets
  declare private _sourceView: SourceView;

  static {
    GObject.registerClass(
      {
        GTypeName: "Disassembled",
        Template,
        InternalChildren: ["sourceView"],
        Signals: {
          copy: {
            param_types: [GObject.TYPE_STRING],
          },
        },
      },
      this
    );
  }

  private _events = new EventDispatcher<DisassembledEventMap>();

  get events(): EventDispatcher<DisassembledEventMap> {
    return this._events;
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);

    this._sourceView.connect("copy", this.onCopy.bind(this));
  }

  public update(assembler: Assembler) {
    const disassembledData = assembler.disassemble();

    // Extract only the assembly instructions (opCode + formattedArgs)
    const assemblyCode = disassembledData.instructions
      .map((inst) => `${inst.opCode} ${inst.formattedArgs}`)
      .join("\n");

    this._sourceView.buffer.text = assemblyCode;
  }

  private onCopy(_sourceView: SourceView, code: string) {
    this.emit("copy", code); // Deprecated
    this.events.dispatch("copy", { code });
  }

  public clear(): void {
    this._sourceView.buffer.text = "";
  }
}

GObject.type_ensure(Disassembled.$gtype);
