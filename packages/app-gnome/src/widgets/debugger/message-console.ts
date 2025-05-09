import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";

import Template from "./message-console.blp";

import { type MessageConsoleWidget } from "@learn6502/common-ui";

export class MessageConsole extends Adw.Bin implements MessageConsoleWidget {
  // Child widgets
  declare private _textView: Gtk.TextView;

  static {
    GObject.registerClass(
      {
        GTypeName: "MessageConsole",
        Template,
        InternalChildren: ["textView"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
  }

  public log(message: string) {
    message =
      this._textView.buffer.cursor_position > 0 ? "\n" + message : message;
    this._textView.buffer.insert_at_cursor(message, message.length);
  }

  public warn(message: string) {
    message =
      this._textView.buffer.cursor_position > 0 ? "\n\n" + message : message;
    this._textView.buffer.insert_at_cursor(message, message.length);
  }

  public error(message: string) {
    message =
      this._textView.buffer.cursor_position > 0 ? "\n\n" + message : message;
    this._textView.buffer.insert_at_cursor(message, message.length);
  }

  public clear() {
    this._textView.buffer.set_text("", 0);
  }

  public prompt(message: string, defaultValue?: string): string | null {
    throw new Error("Not implemented");
  }
}

GObject.type_ensure(MessageConsole.$gtype);
