import type { View } from "@nativescript/core";
import { Application } from "@nativescript/core";


// Adwaita native widgets
import { Adw } from "@gjsify/adwaita-nativescript";
import type { Gtk } from "@gjsify/adwaita-nativescript";
import type GjsAdw from "@girs/adw-1";
import type GjsGtk from "@girs/gtk-4.0";
import { buildWithSiblings } from "@gjsify/adwaita-nativescript/builder";
// The GNOME app's own main window Blueprint, built by the shared-tree builder: its `Adw.Breakpoint`s
// move the four screens between the view stack and the three columns.
import mainWindowTree from "../../../app-gnome/src/views/main.window.blp?shared-tree";

import { ViewType, gameConsoleController } from "@learn6502/common-ui";

// Services / utils
import { createMainWindowServices } from "~/services/main-window.services";
import { showError, logger } from "~/utils";
import { translate } from "~/utils/translate";

// The template classes main.window.blp names (MainButton and Toolbar) register with @learn6502/ui.
import {
  MainWindowController,
  PreferencesDialog,
  addAppActions,
  createMainMenu,
  createAboutDialog,
  notificationService,
  settings,
  themeService,
  type MainButton,
  WindowShell,
} from "@learn6502/ui";
import { bindScreenLifecycle, createScreens, type Screens } from "./main/screens";
import { simulatorStack } from "./main/game-console";

/**
 * The Android shell around the shared `MainWindowController`: the window built from the GNOME app's
 * `main.window.blp`, the Android services (SAF files, share sheet, settings), the gamepad keys and
 * the hardware back button. Navigation, the run/step/assemble flow and the files are the shared
 * controller's.
 */
export class MainController {
  private log = logger.scoped("MainController");

  private shell: WindowShell | null = null;
  private controller: MainWindowController | null = null;
  private mainButton: MainButton | null = null;

  constructor() {
    this.log.debug("Initialized");
  }

  // --- Lifecycle ---
  /** Build the window from main.window.blp for the application's `activate`. */
  public build(application: Adw.Application): Adw.ApplicationWindow {
    this.setupAndroidKeyHandling();
    return this.buildShell(application);
  }

  // --- Shell construction ---
  private buildShell(application: Adw.Application): Adw.ApplicationWindow {
    // The blueprint builds the screens, so the back button reaches them only once they exist.
    let screens: Screens | null = null;
    const { root, siblings } = buildWithSiblings(mainWindowTree, {
      // `clicked => $_onLearnBackButtonClicked()` in the blueprint.
      scope: { _onLearnBackButtonClicked: () => screens?.learn.widget.navigateBack() },
      translate,
    });
    if (!(root instanceof Adw.ApplicationWindow))
      throw new Error("The main window tree must build an Adw.ApplicationWindow");
    screens = createScreens(siblings);
    // The widgets are typed against the GJS bindings, but at run time they are NativeScript views.
    const byId = <T>(id: string): T => root.getViewById<View>(id) as unknown as T;

    const shell = new WindowShell(
      root as unknown as GjsAdw.ApplicationWindow,
      {
        learn: screens.learn.widget,
        editor: screens.editor.widget,
        debugger: screens.debugger.widget,
        gameConsole: screens.gameConsole.widget,
        stack: byId<GjsAdw.ViewStack>("stack"),
        switcherBar: byId<GjsAdw.ViewSwitcherBar>("switcherBar"),
        layoutHost: byId<GjsGtk.Stack>("layoutHost"),
        leftSidebar: byId<GjsAdw.OverlaySplitView>("leftSidebar"),
        leftColumn: byId<GjsGtk.Box>("leftColumn"),
        centerColumn: byId<GjsGtk.Box>("centerColumn"),
        rightTopBox: byId<GjsGtk.Box>("rightTopBox"),
        rightBottomBox: byId<GjsGtk.Box>("rightBottomBox"),
        rightColumnContent: byId<GjsGtk.Box>("rightColumnContent"),
        // A sibling of the window and not a view: it presents through the platform's dialog.
        unsavedChangesDialog: siblings.get("unsavedChangesDialog") as unknown as GjsAdw.AlertDialog,
        titleLabel: byId<GjsGtk.Label>("titleLabel"),
        unsavedChangesIndicator: byId<GjsGtk.Button>("unsavedChangesIndicator"),
        learnBackButton: byId<GjsGtk.Button>("learnBackButton"),
      },
      { initialView: ViewType.EDITOR }
    );
    this.shell = shell;
    // Before the controller's own handlers, so a screen is shown before the window reacts to it.
    bindScreenLifecycle(shell, screens);
    themeService.init(settings);
    themeService.registerThemedWidget(root as unknown as GjsGtk.Widget);
    this.mainButton = byId<MainButton>("mainButton");
    type ToastOverlay = Parameters<typeof notificationService.init>[1];
    notificationService.init(root as unknown as GjsGtk.Window, byId<ToastOverlay>("toastOverlay"));

    const controller = new MainWindowController(
      shell,
      {
        editor: screens.editor.widget,
        gameConsole: screens.gameConsole.widget,
        learn: screens.learn.widget,
        debugger: screens.debugger.widget,
        mainButton: this.mainButton,
        simulatorStack,
      },
      createMainWindowServices(() => controller.navigateToView(ViewType.LEARN))
    );
    this.controller = controller;
    // The shared main menu; its `app.*` items resolve through the application the window is added to.
    root.application = application;
    // Presented over the window, which hosts it and so lets the hardware back button close it.
    const about = createAboutDialog(__APP_VERSION__);
    addAppActions(application as unknown as GjsGtk.Application, {
      quit: () => shell.closeWindow(),
      about: () => about.present(root as unknown as GjsGtk.Widget),
      preferences: () => new PreferencesDialog().present(root as unknown as GjsGtk.Widget),
    });
    controller.init();

    // The model is typed against GJS (`Gio.Menu`), the NativeScript button takes its portable twin.
    const menuButton = byId<Gtk.MenuButton>("menuButton");
    menuButton.menu_model = createMainMenu({ preferences: true }) as unknown as typeof menuButton.menu_model;

    return root;
  }

  // --- Setup helpers ---
  private setupAndroidKeyHandling(): void {
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
}

