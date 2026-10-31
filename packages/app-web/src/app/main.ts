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

import { Adw } from "@gjsify/adwaita-web";
import type GjsAdw from "@girs/adw-1";
// The template classes the .blp files name ($Learn, $MainButton, $Toolbar, $QuickHelpView, …) register with @learn6502/ui.
import { MainWindow, settings, themeService } from "@learn6502/ui";

import { initResources } from "./resources.js";
import { injectShellStyles } from "./styles.js";

/** The application id, as in the GNOME app. */
const APPLICATION_ID = "eu.jumplink.Learn6502";

initResources();
injectShellStyles();
themeService.init(settings);

// It resolves the menu's `app.*` actions and runs the accelerators. Never `runAsync`: the page is already running.
const application = new Adw.Application();
application.application_id = APPLICATION_ID;

const mainWindow = new MainWindow(application as unknown as GjsAdw.Application);
document.body.appendChild(mainWindow as unknown as Node);
