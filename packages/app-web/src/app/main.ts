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

import { Gio } from "@gjsify/adwaita-web"; // registers the custom elements + self-injects the skin
import resourceBytes from "../../../app-gnome/data/eu.jumplink.Learn6502.data.gresource.xml";
import { MainWindow } from "./main-window.js";

// The shared @learn6502/ui widgets name app icons that GNOME resolves from its gresource; the same
// bytes feed the icon theme here, and GtkApplication adds `<resource-base-path>/icons/` at startup.
Gio.resources_register(Gio.Resource.new_from_data(resourceBytes));

const mainWindow = new MainWindow();
mainWindow.mount(document.body);
