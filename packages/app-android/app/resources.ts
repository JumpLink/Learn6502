import { Gdk, Gio, Gtk } from "@gjsify/adwaita-nativescript";
import resourceData from "../../app-gnome/data/eu.jumplink.Learn6502.data.gresource.xml";
import { RESOURCES_PATH } from "./constants";

/**
 * Register the GResource app-gnome ships, compiled into the bundle, and point the icon theme at
 * its icons — the lines app-gnome's `resources.ts` runs, so the shared @learn6502/ui widgets name
 * the same icons on both. The NativeScript app has no `Gtk.Application` whose `startup` would add
 * the path.
 */
export function initResources(): void {
  Gio.resources_register(Gio.Resource.new_from_data(resourceData));
  const display = Gdk.Display.get_default();
  if (!display) {
    throw new Error("Display not found");
  }
  Gtk.IconTheme.get_for_display(display).add_resource_path(`${RESOURCES_PATH}/icons`);
}
