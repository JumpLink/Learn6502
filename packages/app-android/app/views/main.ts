import type { Page, EventData, View } from "@nativescript/core";
import { Application, GridLayout } from "@nativescript/core";

import { systemStates, SystemStates } from "~/states";

// Adwaita native widgets
import { Adw, setAdwaitaColorScheme } from "@gjsify/adwaita-nativescript";
import type { Gtk } from "@gjsify/adwaita-nativescript";
import type GjsGtk from "@girs/gtk-4.0";
import { buildWithSiblings } from "@gjsify/adwaita-nativescript/builder";
// The GNOME app's own main window Blueprint, built by the shared-tree builder: its `Adw.Breakpoint`s
// move the four screens between the view stack and the three columns.
import mainWindowTree from "../../../app-gnome/src/views/main.window.blp?shared-tree";

import { ViewType, gameConsoleController } from "@learn6502/common-ui";

// Services / utils
import { createMainWindowServices } from "~/services/main-window.services";
import type { SystemAppearanceChangeEvent } from "~/types";
import { APPLICATION_ID } from "~/constants";
import { showError, logger } from "~/utils";
import { setAppBackHandler } from "~/utils/navigation";
import { translate } from "~/utils/translate";

// The template classes main.window.blp names (MainButton and Toolbar) register with @learn6502/ui.
import { MainWindowController, addAppActions, createMainMenu, getAboutInfo, type MainButton } from "@learn6502/ui";
import { createScreens } from "./main/screens";
import { simulatorStack } from "./main/game-console";
import { NativeMainWindowShell } from "./main/shell";

/**
 * The Android shell around the shared `MainWindowController`: the window built from the GNOME app's
 * `main.window.blp`, the Android services (SAF files, share sheet, settings), the gamepad keys and
 * the hardware back button. Navigation, the run/step/assemble flow and the files are the shared
 * controller's.
 */
export class MainController {
  private log = logger.scoped("MainController");

  private shell: NativeMainWindowShell | null = null;
  private controller: MainWindowController | null = null;
  private mainButton: MainButton | null = null;
  private about: Adw.AboutDialog | null = null;

  constructor() {
    this.log.debug("Initialized");
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
  }

  // --- Lifecycle ---
  public onLoaded(args: EventData): void {
    const page = args.object as Page;

    // Follow the OS color scheme for the symbolic-icon bitmaps (CSS .ns-dark is
    // handled by NS; this keeps the pre-coloured icons in sync). Seed at mount.
    try {
      setAdwaitaColorScheme(Application.systemAppearance() === "dark" ? "dark" : "light");
    } catch {
      /* systemAppearance unavailable — default light */
    }

    systemStates.events.on(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    this.setupAndroidKeyHandling();

    // Build the shell from main.window.blp and install it as the page content.
    page.content = this.buildShell();

    // Hardware back: let the visible screens consume it (e.g. the Learn screen pops its internal
    // Adw.NavigationView). Registered with the global back handler so it runs before the default
    // Frame / move-to-background logic.
    setAppBackHandler(() => this.shell?.handleBack() ?? false);
  }

  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    this.log.debug("unloaded:", view.id);
    setAppBackHandler(null);
    this.controller?.disconnect();
    this.mainButton?.unbind();
    systemStates.events.off(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);
  }

  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    // NS flips the `ns-dark` class on the root automatically; keep the Adwaita icon
    // bitmaps in sync with the new scheme.
    try {
      setAdwaitaColorScheme(event.newValue === "dark" ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }

  // --- Shell construction ---
  private buildShell(): View {
    const screens = createScreens();

    const { root } = buildWithSiblings(mainWindowTree, {
      // `clicked => $_onLearnBackButtonClicked()` in the blueprint.
      scope: { _onLearnBackButtonClicked: () => screens.learn.widget.navigateBack() },
      translate,
    });
    // The widgets are typed against the GJS bindings, but at run time they are NativeScript views.
    const byId = <T>(id: string): T => root.getViewById<View>(id) as unknown as T;

    const shell = new NativeMainWindowShell(
      {
        root,
        stack: byId<Adw.ViewStack>("stack"),
        switcherBar: byId<Adw.ViewSwitcherBar>("switcherBar"),
        layoutHost: byId<Gtk.Stack>("layoutHost"),
        leftSidebar: byId<Adw.OverlaySplitView>("leftSidebar"),
        leftColumn: byId<Gtk.Box>("leftColumn"),
        centerColumn: byId<Gtk.Box>("centerColumn"),
        rightTopBox: byId<Gtk.Box>("rightTopBox"),
        rightBottomBox: byId<Gtk.Box>("rightBottomBox"),
        rightColumnContent: byId<Gtk.Box>("rightColumnContent"),
        unsavedChangesDialog: byId<Adw.AlertDialog>("unsavedChangesDialog"),
        titleLabel: byId<Gtk.Label>("titleLabel"),
        learnBackButton: byId<Gtk.Button>("learnBackButton"),
      },
      screens
    );
    this.shell = shell;
    this.mainButton = byId<MainButton>("mainButton");

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
    // Never `runAsync`: NativeScript owns the run loop (`Application.run` in app.ts).
    const application = new Adw.Application();
    application.application_id = APPLICATION_ID;
    // `Gtk.Window:application` is typed as the GJS class; at run time this is the NativeScript one.
    (root as unknown as { application: object }).application = application;
    addAppActions(application as unknown as GjsGtk.Application, {
      quit: () => shell.closeWindow(),
      about: () => this.about?.present(),
    });
    controller.init();
    shell.insertActions();

    this.setupAbout(root);
    // The model is typed against GJS (`Gio.Menu`), the NativeScript button takes its portable twin.
    const menuButton = byId<Gtk.MenuButton>("menuButton");
    menuButton.menuModel = createMainMenu() as unknown as typeof menuButton.menuModel;

    return root;
  }

  /**
   * About dialog — an in-page modal card painted over everything (the window's last child),
   * revealed from the app menu. Mirrors the GNOME app's Adw.AboutDialog.new_from_appdata(metainfo,
   * version).
   */
  private setupAbout(root: View): void {
    const about = new Adw.AboutDialog();
    const info = getAboutInfo();
    about.applicationName = info.applicationName;
    about.version = __APP_VERSION__;
    about.developerName = info.developerName;
    about.comments = info.comments;
    about.website = info.website;
    this.about = about;
    GridLayout.setRow(about, 0);
    GridLayout.setColumn(about, 0);
    (root as GridLayout).addChild(about);
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

// Singleton + bound exports for the XML.
const mainController = new MainController();
export const onLoaded = mainController.onLoaded.bind(mainController);
export const onUnloaded = mainController.onUnloaded.bind(mainController);
