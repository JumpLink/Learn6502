import type Adw from "@girs/adw-1";

import type { ViewType } from "@learn6502/common-ui";

import type { Debugger } from "../debugger/debugger.ts";
import type { Editor } from "../editor/editor.ts";
import type { GameConsole } from "../game-console/game-console.ts";
import type { Learn } from "../learn/learn.ts";
import type { MainWindowParts } from "./main-window-controller.ts";
import type { MainWindowServices } from "./services.ts";
import type { WindowShell } from "./window-shell.ts";

export interface MainWindowScreens {
  editor: Editor;
  gameConsole: GameConsole;
  learn: Learn;
  debugger: Debugger;
}

/** What the window offers the platform part while it is being built. */
export interface MainWindowHost {
  window: Adw.ApplicationWindow;
  application: Adw.Application;
  screens: MainWindowScreens;
  navigateToView(view: ViewType): void;
}

/** What `main-window.services.ts` (and its `.android.ts` / `.web.ts` siblings) hands the shared window. */
export interface MainWindowPlatform {
  services: MainWindowServices;
  initialView?: ViewType;
  simulatorStack?: MainWindowParts["simulatorStack"];
  /** The shell exists, the controller does not yet: bind what must run before the controller's handlers. */
  bindShell?(shell: WindowShell): void;
  /** Run `init` once the window can lay its screens out; the web waits for the tree to be connected. */
  whenReady(init: () => void): void;
  /** The controller is initialised. */
  started?(): void;
}

export type MainWindowPlatformFactory = (host: MainWindowHost) => MainWindowPlatform;

let injected: MainWindowPlatformFactory | null = null;

/**
 * For a platform whose services live in its app (Android: SAF, the share sheet, the screen modules):
 * the app registers them before it builds the window, and `main-window.services.android.ts` hands them on.
 */
export function setMainWindowPlatformFactory(factory: MainWindowPlatformFactory): void {
  injected = factory;
}

export function injectedMainWindowPlatform(host: MainWindowHost): MainWindowPlatform {
  if (!injected) throw new Error("No main window platform registered; call setMainWindowPlatformFactory first");
  return injected(host);
}
