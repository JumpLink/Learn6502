import type GjsGtk from "@girs/gtk-4.0";
import { Application } from "@nativescript/core";

import { ViewType, gameConsoleController } from "@learn6502/common-ui";
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
import { simulatorStack } from "./main/game-console";
import { bindScreenLifecycle, createScreens } from "./main/screens";

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
 * screen modules and the gamepad keys. Navigation, the run/step/assemble flow and the files are the
 * shared controller's. Call before the window is built; `@learn6502/ui` hands it on through
 * `main-window.services.android.ts`.
 */
export function registerMainWindowPlatform(): void {
  setMainWindowPlatformFactory(
    ({ window, application, screens, navigateToView }: MainWindowHost): MainWindowPlatform => {
      setupAndroidKeyHandling();
      const screenModules = createScreens(new Map(Object.entries(screens)));
      return {
        services: createMainWindowServices(() => navigateToView(ViewType.LEARN)),
        initialView: ViewType.EDITOR,
        simulatorStack,
        // Before the controller's own handlers, so a screen is shown before the window reacts to it.
        bindShell: (shell) => {
          bindScreenLifecycle(shell, screenModules);
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
