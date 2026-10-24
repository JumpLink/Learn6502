/**
 * Entry point for the app-web Adwaita SPA shell (Phase 1 of the rewrite).
 *
 * Dev:  `gjsify workspace @learn6502/app-web dev:app`  → Vite (gjsifyBrowser preset)
 * Prod: `gjsify workspace @learn6502/app-web build:app` → `gjsify build --app browser`
 *
 * This shell lives ALONGSIDE the classic Jekyll tutorial (src/main.ts + the
 * `_layouts`/`_includes`), which is untouched — the hard cutover happens in the
 * final phase of the rewrite.
 */

import { Gio, Gtk } from "@gjsify/adwaita-web"; // registers the custom elements + self-injects the skin
import resourceBytes from "../../../app-gnome/data/eu.jumplink.Learn6502.data.gresource.xml";
import { MainWindow } from "./main-window.js";

// The shared @learn6502/ui widgets name app icons that GNOME resolves from its gresource; the same
// bytes feed the icon theme here. GtkApplication would add `<resource-base-path>/icons/` itself, but
// the web shell has no GtkApplication, so the path is added by hand (as app-gnome/resources.ts does).
Gio.resources_register(Gio.Resource.new_from_data(resourceBytes));
Gtk.IconTheme.get_for_display(null).add_resource_path("/eu/jumplink/Learn6502/icons");

const mainWindow = new MainWindow();
mainWindow.mount(document.body);
