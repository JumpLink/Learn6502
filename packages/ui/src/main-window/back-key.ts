import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";

/** GTK delivers a hardware back key as XF86Back; gjsify raises the Android Back button as that same key once dialogs, sheets and navigation pages had their turn. */
export function registerBackKey(window: Gtk.Window, onBack: () => boolean): void {
  const keyController = new Gtk.EventControllerKey();
  window.add_controller(keyController);
  keyController.connect("key-pressed", (_controller: Gtk.EventControllerKey, keyval: number) =>
    keyval === Gdk.KEY_Back ? onBack() : false
  );
}
