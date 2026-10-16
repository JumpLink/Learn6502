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
import bugSymbolic from "../../../app-gnome/data/icons/scalable/actions/bug-symbolic.svg";
import buildAltSymbolic from "../../../app-gnome/data/icons/scalable/actions/build-alt-symbolic.svg";
import clipboardSymbolic from "../../../app-gnome/data/icons/scalable/actions/clipboard-symbolic.svg";
import codeSymbolic from "../../../app-gnome/data/icons/scalable/actions/code-symbolic.svg";
import dotSymbolic from "../../../app-gnome/data/icons/scalable/actions/dot-symbolic.svg";
import dpadDownSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-down-symbolic.svg";
import dpadLeftSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-left-symbolic.svg";
import dpadRightSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-right-symbolic.svg";
import dpadUpSymbolic from "../../../app-gnome/data/icons/scalable/actions/dpad-up-symbolic.svg";
import moveToWindowSymbolic from "../../../app-gnome/data/icons/scalable/actions/move-to-window-symbolic.svg";
import nintendoControllerSymbolic from "../../../app-gnome/data/icons/scalable/actions/nintendo-controller-symbolic.svg";
import openBookSymbolic from "../../../app-gnome/data/icons/scalable/actions/open-book-symbolic.svg";
import pauseSymbolic from "../../../app-gnome/data/icons/scalable/actions/pause-symbolic.svg";
import playSymbolic from "../../../app-gnome/data/icons/scalable/actions/play-symbolic.svg";
import resetSymbolic from "../../../app-gnome/data/icons/scalable/actions/reset-symbolic.svg";
import resumeSymbolic from "../../../app-gnome/data/icons/scalable/actions/resume-symbolic.svg";
import schoolSymbolic from "../../../app-gnome/data/icons/scalable/actions/school-symbolic.svg";
import shareSymbolic from "../../../app-gnome/data/icons/scalable/actions/share-symbolic.svg";
import stepOverSymbolic from "../../../app-gnome/data/icons/scalable/actions/step-over-symbolic.svg";
import { MainWindow } from "./main-window.js";

// The shared @learn6502/ui widgets name these app icons; GNOME resolves them from its gresource.
registerIcon("bug-symbolic", bugSymbolic);
registerIcon("build-alt-symbolic", buildAltSymbolic);
registerIcon("clipboard-symbolic", clipboardSymbolic);
registerIcon("code-symbolic", codeSymbolic);
registerIcon("dot-symbolic", dotSymbolic);
registerIcon("dpad-down-symbolic", dpadDownSymbolic);
registerIcon("dpad-left-symbolic", dpadLeftSymbolic);
registerIcon("dpad-right-symbolic", dpadRightSymbolic);
registerIcon("dpad-up-symbolic", dpadUpSymbolic);
registerIcon("move-to-window-symbolic", moveToWindowSymbolic);
registerIcon("nintendo-controller-symbolic", nintendoControllerSymbolic);
registerIcon("open-book-symbolic", openBookSymbolic);
registerIcon("pause-symbolic", pauseSymbolic);
registerIcon("play-symbolic", playSymbolic);
registerIcon("reset-symbolic", resetSymbolic);
registerIcon("resume-symbolic", resumeSymbolic);
registerIcon("school-symbolic", schoolSymbolic);
registerIcon("share-symbolic", shareSymbolic);
registerIcon("step-over-symbolic", stepOverSymbolic);

const mainWindow = new MainWindow();
mainWindow.mount(document.body);
