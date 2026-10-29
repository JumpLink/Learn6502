import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";

import { gameConsoleController } from "../controller/index.ts";

/** The game console's keys on every platform: GTK's key controller, which gjsify forwards Android and DOM keys into. */
export function registerGameKeys(window: Gtk.Window): void {
  const keyController = new Gtk.EventControllerKey();
  window.add_controller(keyController);
  keyController.connect("key-pressed", (_controller: Gtk.EventControllerKey, keyval: number) =>
    gameConsoleController.handleKeyPress(keyval)
  );
  gameConsoleController.registerKeyMappings({
    [Gdk.KEY_w]: "Up",
    [Gdk.KEY_s]: "Down",
    [Gdk.KEY_a]: "Left",
    [Gdk.KEY_d]: "Right",
    [Gdk.KEY_Up]: "Up",
    [Gdk.KEY_Down]: "Down",
    [Gdk.KEY_Left]: "Left",
    [Gdk.KEY_Right]: "Right",
    [Gdk.KEY_Return]: "A",
    [Gdk.KEY_q]: "A",
    [Gdk.KEY_space]: "B",
    [Gdk.KEY_e]: "B",
  });
}
