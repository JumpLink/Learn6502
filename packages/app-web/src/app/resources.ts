import { Gdk, Gio, Gtk } from "@gjsify/adwaita-web";
import resourceData from "../../../app-gnome/data/eu.jumplink.Learn6502.data.gresource.xml";

const RESOURCES_PATH = "/eu/jumplink/Learn6502";

/**
 * Register the GResource app-gnome ships, compiled into the bundle, and point the icon theme at
 * its icons — the lines app-gnome's `resources.ts` runs, so the shared @learn6502/ui widgets name
 * the same icons on both. The page never calls `run`, so no `startup` adds the path for us.
 */
export function initResources(): void {
  Gio.resources_register(Gio.Resource.new_from_data(resourceData));
  const display = Gdk.Display.get_default();
  if (!display) {
    throw new Error("Display not found");
  }
  Gtk.IconTheme.get_for_display(display).add_resource_path(`${RESOURCES_PATH}/icons`);
}
