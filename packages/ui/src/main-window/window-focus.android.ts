import type Gtk from "@girs/gtk-4.0";

/** NativeScript refuses `notify::focus-widget`, and Android has no in-window focus to follow. */
export function watchFocusWidget(_window: Gtk.Window, _handler: () => void): void {}
