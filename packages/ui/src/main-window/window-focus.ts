import type Gtk from "@girs/gtk-4.0";

/** Call `handler` whenever the focused widget inside the window changes. */
export function watchFocusWidget(window: Gtk.Window, handler: () => void): void {
  window.connect("notify::focus-widget", handler);
}
