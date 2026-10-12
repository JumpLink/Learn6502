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

import { registerIcon } from "@gjsify/adwaita-web"; // registers the custom elements + self-injects the skin
import clipboardSymbolic from "../../../app-gnome/data/icons/scalable/actions/clipboard-symbolic.svg";
import moveToWindowSymbolic from "../../../app-gnome/data/icons/scalable/actions/move-to-window-symbolic.svg";
import dpadDownSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-down-symbolic.svg";
import dpadLeftSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-left-symbolic.svg";
import dpadRightSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-right-symbolic.svg";
import dpadUpSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-up-symbolic.svg";
import { MainWindow } from "./main-window.js";

// The shared @learn6502/ui widgets name these app icons; GNOME resolves them from its gresource.
registerIcon("clipboard-symbolic", clipboardSymbolic);
registerIcon("move-to-window-symbolic", moveToWindowSymbolic);
registerIcon("dpad-down-symbolic", dpadDownSymbolic);
registerIcon("dpad-left-symbolic", dpadLeftSymbolic);
registerIcon("dpad-right-symbolic", dpadRightSymbolic);
registerIcon("dpad-up-symbolic", dpadUpSymbolic);

const mainWindow = new MainWindow();
mainWindow.mount(document.body);
