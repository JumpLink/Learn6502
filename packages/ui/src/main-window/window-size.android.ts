import type Gtk from "@girs/gtk-4.0";

import type { WindowSettings } from "./services.ts";

/** The NativeScript window is always maximized and refuses `unmaximize()`: there is no size to persist. */
export function persistWindowSize(_window: Gtk.Window, _settings: WindowSettings): void {}
