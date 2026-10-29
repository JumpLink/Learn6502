import type GjsGtk from "@girs/gtk-4.0";
import { Application } from "@nativescript/core";

import { ViewType, createSimulatorStack, gameConsoleController } from "@learn6502/common-ui";
import {
  PreferencesDialog,
  addAppActions,
  createAboutDialog,
  setMainWindowPlatformFactory,
  type MainWindowHost,
  type MainWindowPlatform,
} from "@learn6502/ui";

import { createMainWindowServices } from "~/services/main-window.services";
import { showError } from "~/utils";
import { persistEditorCode } from "./main/editor";
import { buildTutorialOnFirstVisit } from "./main/learn";

/** One simulator stack for the process: the activity, and the widgets with it, are rebuilt around it. */
const simulatorStack = createSimulatorStack();

/** The widgets of the previous activity, if it was recreated: they stop listening to the controllers first. */
let previous: { unbind(): void }[] = [];

/** The gamepad keys and the hardware keys the activity forwards to the game console. */
function setupAndroidKeyHandling(): void {
  const KEY_UP = 19;
  const KEY_DOWN = 20;
  const KEY_LEFT = 21;
  const KEY_RIGHT = 22;
  const KEY_ENTER = 66;
  const KEY_SPACE = 62;

  gameConsoleController.registerKeyMappings({
    [KEY_UP]: "Up",
    [KEY_DOWN]: "Down",
    [KEY_LEFT]: "Left",
    [KEY_RIGHT]: "Right",
    [KEY_ENTER]: "A",
    [KEY_SPACE]: "B",
  });

  if (Application.android) {
    try {
      const activity = Application.android.foregroundActivity;
      if (activity) {
        activity.onKeyDown = (keyCode: number) => {
          return gameConsoleController.handleKeyPress(keyCode);
        };
      }
    } catch (error) {
      showError(error, { silent: true });
    }
  }
}

/**
 * What the shared `MainWindow` takes from Android: the services (SAF files, share sheet, settings), the
 * persisted editor code, the tutorial and the gamepad keys. Navigation, the run/step/assemble flow and the files are the
 * shared controller's. Call before the window is built; `@learn6502/ui` hands it on through
 * `main-window.services.android.ts`.
 */
export function registerMainWindowPlatform(): void {
  setMainWindowPlatformFactory(
    ({ window, application, screens, navigateToView }: MainWindowHost): MainWindowPlatform => {
      setupAndroidKeyHandling();
      for (const widget of previous) widget.unbind();
      previous = [screens.editor, screens.debugger, screens.gameConsole];
      persistEditorCode();
      buildTutorialOnFirstVisit(screens.learn);
      return {
        services: createMainWindowServices(() => navigateToView(ViewType.LEARN)),
        initialView: ViewType.EDITOR,
        simulatorStack,
        bindShell: (shell) => {
          // Presented over the window, which hosts it and so lets the hardware back button close it.
          const about = createAboutDialog(__APP_VERSION__);
          addAppActions(application as unknown as GjsGtk.Application, {
            quit: () => shell.closeWindow(),
            about: () => about.present(window as unknown as GjsGtk.Widget),
            preferences: () => new PreferencesDialog().present(window as unknown as GjsGtk.Widget),
          });
        },
        whenReady: (init) => init(),
      };
    }
  );
}
