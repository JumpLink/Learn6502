import type Gtk from "@girs/gtk-4.0";

import type { WindowSettings } from "./services.ts";

/** Restore the saved window geometry and keep saving it while the user resizes. */
export function persistWindowSize(window: Gtk.Window, settings: WindowSettings): void {
  try {
    if (settings.getBoolean("is-maximized")) {
      window.maximize();
    } else {
      window.set_default_size(settings.getInt("window-width"), settings.getInt("window-height"));
    }
  } catch (error) {
    console.warn("Could not load window size from settings:", error);
    // Fall back to the Blueprint defaults
  }

  const saveSize = () => {
    if (window.is_maximized()) return; // A maximized window's size says nothing about the restored one
    try {
      const [width, height] = window.get_default_size();
      settings.setInt("window-width", width);
      settings.setInt("window-height", height);
    } catch (error) {
      console.warn("Could not save window size to settings:", error);
    }
  };

  window.connect("notify::default-width", saveSize);
  window.connect("notify::default-height", saveSize);
  window.connect("notify::maximized", () => settings.setBoolean("is-maximized", window.is_maximized()));
}
