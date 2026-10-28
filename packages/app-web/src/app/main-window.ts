/**
 * MainWindow — the app-web Adwaita SPA shell.
 *
 * Web counterpart of the GNOME `MainWindow`: the window is built from the GNOME app's own
 * `main.window.blp`, whose `Adw.Breakpoint`s move the four screens between the view stack and the
 * three columns. The window's logic — navigation, the run/step/assemble flow, files and the
 * unsaved-changes guard — is the shared `MainWindowController`; this file injects what the browser
 * provides (file pickers, clipboard, toasts). Placing the screens is the shared `WindowShell`'s.
 */

import type GjsAdw from "@girs/adw-1";
import type GjsGtk from "@girs/gtk-4.0";
import { Adw, buildWithSiblings, type Gtk } from "@gjsify/adwaita-web";
import { ViewType, editorController, mainStateController } from "@learn6502/common-ui";
// The template classes main.window.blp names ($Learn, $MainButton, $Toolbar, …) register with @learn6502/ui.
import {
  MainWindowController,
  PreferencesDialog,
  addAppActions,
  createMainMenu,
  createAboutDialog,
  notificationService,
  settings,
  themeService,
  type Debugger,
  type Editor,
  FileService,
  type GameConsole,
  type Learn,
  type MainButton,
  type MainWindowServices,
  WindowShell,
} from "@learn6502/ui";
import mainWindowTree from "../../../app-gnome/src/views/main.window.blp?shared-tree";

import "../widgets/learn/index.js"; // registers `$TutorialView` for the shared learn.blp
import "../widgets/quick-help.js"; // registers `$QuickHelpView` for the shared editor.blp
import { injectShellStyles } from "./styles.js";

/** The application id, as in the GNOME app. */
const APPLICATION_ID = "eu.jumplink.Learn6502";

/** Learn6502 project repository — the "share your example" destination. */
const SHARE_URL = "https://github.com/JumpLink/Learn6502";

/** The starter program the Editor opens with — Assemble, then Run or Step. */
const DEMO_PROGRAM = `; Fill the display page at $0200 with random colors.
; Assemble, then Run or Step to watch the debugger update.
  LDX #$00
loop:
  LDA $fe        ; random byte
  STA $0200,X
  INX
  BNE loop
  BRK
`;

export class MainWindow {
  /** The root element to mount into the document. */
  public readonly root: Adw.ApplicationWindow;

  private readonly fileService = new FileService();
  private readonly screens: { learn: Learn; editor: Editor; debugger: Debugger; gameConsole: GameConsole };
  private readonly objects: ReadonlyMap<string, HTMLElement>;
  private readonly shell: WindowShell;
  private controller: MainWindowController | null = null;

  constructor() {
    injectShellStyles();
    themeService.init(settings);

    // The blueprint builds the screens, so the back button reaches them only once they exist.
    let learn: Learn | null = null;
    const { root, siblings, objects } = buildWithSiblings(mainWindowTree, {
      // `clicked => $_onLearnBackButtonClicked()` in the blueprint.
      scope: { _onLearnBackButtonClicked: () => learn?.navigateBack() },
    });
    if (!(root instanceof Adw.ApplicationWindow))
      throw new Error("The main window tree must build an Adw.ApplicationWindow");
    this.root = root;
    this.objects = objects;
    themeService.registerThemedWidget(root as unknown as GjsGtk.Widget);

    // The widgets are typed against the GJS bindings, but at run time they are custom elements.
    const sibling = <T>(id: string): T => {
      const object = siblings.get(id);
      if (!object) throw new Error(`main.window.blp built no '${id}' object`);
      return object as unknown as T;
    };
    this.screens = {
      learn: sibling<Learn>("learn"),
      editor: sibling<Editor>("editor"),
      debugger: sibling<Debugger>("debugger"),
      gameConsole: sibling<GameConsole>("gameConsole"),
    };
    learn = this.screens.learn;
    notificationService.init(
      root as unknown as GjsGtk.Window,
      this.byId<Parameters<typeof notificationService.init>[1]>("toastOverlay")
    );

    // so `close()` hides the frame instead of detaching it and leaving a blank page
    root.hide_on_close = true;
    // The shell is typed against the GJS bindings; at run time these are custom elements.
    this.shell = new WindowShell(
      root as unknown as GjsAdw.ApplicationWindow,
      {
        ...this.screens,
        stack: this.byId<GjsAdw.ViewStack>("stack"),
        switcherBar: this.byId<GjsAdw.ViewSwitcherBar>("switcherBar"),
        layoutHost: this.byId<GjsGtk.Stack>("layoutHost"),
        leftSidebar: this.byId<GjsAdw.OverlaySplitView>("leftSidebar"),
        leftColumn: this.byId<GjsGtk.Box>("leftColumn"),
        centerColumn: this.byId<GjsGtk.Box>("centerColumn"),
        rightTopBox: this.byId<GjsGtk.Box>("rightTopBox"),
        rightBottomBox: this.byId<GjsGtk.Box>("rightBottomBox"),
        rightColumnContent: this.byId<GjsGtk.Box>("rightColumnContent"),
        unsavedChangesDialog: sibling<GjsAdw.AlertDialog>("unsavedChangesDialog"),
        titleLabel: this.byId<GjsGtk.Label>("titleLabel"),
        unsavedChangesIndicator: this.byId<GjsGtk.Button>("unsavedChangesIndicator"),
        learnBackButton: this.byId<GjsGtk.Button>("learnBackButton"),
      },
      { initialView: ViewType.EDITOR }
    );

    const menuButton = this.byId<Gtk.MenuButton>("menuButton");
    // The model is typed against GJS (`Gio.Menu`); the element takes its portable twin.
    menuButton.menu_model = createMainMenu({ preferences: true }) as unknown as typeof menuButton.menu_model;
    this.linkApplication();
  }

  private byId<T>(id: string): T {
    const object = this.objects.get(id);
    if (!object) throw new Error(`main.window.blp built no '${id}' object`);
    return object as unknown as T;
  }

  /**
   * The application the window belongs to: it resolves the menu's `app.*` actions and runs the
   * accelerators. Never `runAsync`: the page is already running.
   */
  private linkApplication(): void {
    const application = new Adw.Application();
    application.application_id = APPLICATION_ID;
    this.root.application = application;
    const about = this.createAboutDialog();
    addAppActions(application as unknown as GjsGtk.Application, {
      quit: () => this.shell.closeWindow(),
      about: () => about.present(),
      preferences: () => new PreferencesDialog().present(this.root as unknown as GjsGtk.Widget),
    });
  }

  /** The dialog is an in-page overlay, so it lives in the window like any other child. */
  private createAboutDialog(): Adw.AboutDialog {
    const about = createAboutDialog(__APP_VERSION__) as unknown as Adw.AboutDialog;
    this.root.appendChild(about);
    return about;
  }

  /**
   * Attach the window to the document, then wire the controller. The layout MUST be mounted after
   * the tree is connected: the elements build their internals on connect.
   */
  public mount(parent: HTMLElement): void {
    // The browser tab is the work area: the window fills it, the blueprint's default size is GNOME's.
    this.root.maximize();
    parent.appendChild(this.root);

    editorController.setCode(DEMO_PROGRAM);
    mainStateController.setCodeChanged(false);

    const controller = new MainWindowController(
      this.shell,
      {
        editor: this.screens.editor,
        gameConsole: this.screens.gameConsole,
        learn: this.screens.learn,
        debugger: this.screens.debugger,
        mainButton: this.byId<MainButton>("mainButton"),
      },
      this.createServices()
    );
    this.controller = controller;
    controller.init();
    this.fileService.setUnsavedChanges(false);
  }

  private createServices(): MainWindowServices {
    const files = this.fileService;
    return {
      files: {
        openFile: () => files.openFile(),
        saveFile: (content) => files.saveFile(content),
        saveFileAs: (content, suggestedName) => files.saveFileAs(content, suggestedName),
        getCurrentFileName: () => files.getCurrentFileName(),
        hasCurrentFile: () => files.hasCurrentFile(),
        hasUnsavedChanges: () => files.hasUnsavedChanges(),
        setUnsavedChanges: (hasChanges) => files.setUnsavedChanges(hasChanges),
      },
      // The browser tab owns its size, so there is no geometry to keep
      settings: { getInt: () => 0, setInt: () => {}, getBoolean: () => false, setBoolean: () => {} },
      clipboard: {
        copy: (text) => {
          if (!navigator.clipboard) return false;
          void navigator.clipboard.writeText(text);
          return true;
        },
      },
      notifier: { show: (options) => notificationService.showNotification(options) },
      // The Editor's 6502 quick-help sheet is the web app's help
      showHelp: () => {
        this.controller?.navigateToView(ViewType.EDITOR);
        editorController.setHelpVisible(true);
      },
      showShareDialog: () => window.open(SHARE_URL, "_blank", "noopener,noreferrer"),
      submitExample: () => window.open(SHARE_URL, "_blank", "noopener,noreferrer"),
    };
  }
}
