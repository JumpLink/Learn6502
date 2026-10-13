import type Gtk from "@girs/gtk-4.0";

import type { WindowSettings } from "./services.ts";

/** The browser tab owns its size. */
export function persistWindowSize(_window: Gtk.Window, _settings: WindowSettings): void {}
