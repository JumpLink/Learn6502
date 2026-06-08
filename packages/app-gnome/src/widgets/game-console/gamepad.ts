import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { type GamepadKey, type GamepadWidget, type GamepadEventMap, getGamepadKeyCode } from "@learn6502/common-ui";

import Template from "./gamepad.blp";
import { EventDispatcher } from "@learn6502/6502";

export class Gamepad extends Adw.Bin implements GamepadWidget {
  readonly events: EventDispatcher<GamepadEventMap> = new EventDispatcher<GamepadEventMap>();

  // Child widgets
  declare private _buttonLeft: Gtk.Button;
  declare private _buttonRight: Gtk.Button;
  declare private _buttonUp: Gtk.Button;
  declare private _buttonDown: Gtk.Button;
  declare private _buttonA: Gtk.Button;
  declare private _buttonB: Gtk.Button;

  static {
    GObject.registerClass(
      {
        GTypeName: "Gamepad",
        Template,
        InternalChildren: ["buttonLeft", "buttonRight", "buttonUp", "buttonDown", "buttonA", "buttonB"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

    // The d-pad is a spatial control, not text: keep its inner layout
    // left-to-right in every locale. In RTL, GTK mirrors the d-pad box, which
    // moves the buttons but not their physical rounded corners (so the cross
    // breaks) and flips the direction-aware go-previous/go-next arrows.
    this._buttonLeft.parent!.set_direction(Gtk.TextDirection.LTR);

    this._buttonUp.connect("clicked", () => {
      this.press("Up");
    });

    this._buttonDown.connect("clicked", () => {
      this.press("Down");
    });

    this._buttonLeft.connect("clicked", () => {
      this.press("Left");
    });

    this._buttonRight.connect("clicked", () => {
      this.press("Right");
    });

    this._buttonA.connect("clicked", () => {
      this.press("A");
    });

    this._buttonB.connect("clicked", () => {
      this.press("B");
    });
  }

  public press(buttonName: GamepadKey): void {
    this.events.dispatch("keyPressed", {
      key: buttonName,
      keyCode: getGamepadKeyCode(buttonName),
    });
  }
}

GObject.type_ensure(Gamepad.$gtype);
