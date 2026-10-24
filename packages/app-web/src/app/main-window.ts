/**
 * MainWindow — the app-web Adwaita SPA shell.
 *
 * Web counterpart of the GNOME `MainWindow` (`app-gnome/src/views/main.window`). The window's logic —
 * navigation, the run/step/assemble flow, files and the unsaved-changes guard — is the shared
 * `MainWindowController`; this file builds the chrome on `@gjsify/adwaita-web` and injects what the
 * browser provides (file pickers, clipboard, toasts). The layout and the actions live in
 * `DomMainWindowShell`.
 *
 * Structure (mapped to app-gnome's `main.window.blp`):
 *   Adw.ToolbarView
 *     [top]    Adw.HeaderBar — window title, sidebar toggle, learn-back button,
 *              run controls, primary Gtk.MenuButton
 *     content  Adw.ToastOverlay > #layout-host (the shell's single / three-column layouts)
 *     [bottom]  Adw.ViewSwitcherBar — mobile tab bar bound to the stack
 */

import type GjsGtk from "@girs/gtk-4.0";
import { Adw, Gtk } from "@gjsify/adwaita-web";
import { ViewType, editorController, mainStateController } from "@learn6502/common-ui";
import {
  Debugger,
  Editor,
  GameConsole,
  Learn,
  MainWindowController,
  addAppActions,
  createMainMenu,
  commentsWithEdition,
  getAboutInfo,
  type MainWindowServices,
} from "@learn6502/ui";

import "../widgets/learn/index.js"; // registers `$TutorialView` for the shared learn.blp
import "../widgets/quick-help.js"; // registers `$QuickHelpView` for the shared editor.blp
import { FileService } from "./file.service.js";
import { DomMainWindowShell } from "./main-window.shell.js";
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

/** A header button and the actions it stands for; it is enabled while any of them is. */
interface RunButton {
  button: Gtk.Button;
  actions: string[];
}

export class MainWindow {
  /** The root element to mount into the document. */
  public readonly root: Adw.ApplicationWindow;

  private readonly learnView = new Learn();
  private readonly editorView = new Editor();
  private readonly debuggerView = new Debugger();
  private readonly gameConsoleView = new GameConsole();

  private readonly fileService = new FileService();
  private readonly toastOverlay = new Adw.ToastOverlay();
  private readonly switcherBar = new Adw.ViewSwitcherBar();
  private readonly titleWidget = new Adw.WindowTitle();
  private readonly runControls = document.createElement("div");
  private readonly sidebarToggle = new Gtk.Button();
  private readonly learnBackButton = new Gtk.Button();
  private readonly runButtons: RunButton[] = [];

  private readonly shell: DomMainWindowShell;
  private controller: MainWindowController | null = null;

  constructor() {
    injectShellStyles();

    this.root = new Adw.ApplicationWindow();
    this.root.id = "application-window";
    this.shell = new DomMainWindowShell({
      window: this.root,
      learn: this.learnView,
      editor: this.editorView,
      debugger: this.debuggerView,
      gameConsole: this.gameConsoleView,
      switcherBar: this.switcherBar,
      sidebarToggle: this.sidebarToggle,
      learnBackButton: this.learnBackButton,
      runControls: this.runControls,
      titleWidget: this.titleWidget,
    });
    this.buildChrome();
    this.linkApplication();
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
    });
  }

  /** The dialog is an in-page overlay, so it lives in the window like any other child. */
  private createAboutDialog(): Adw.AboutDialog {
    const info = getAboutInfo();
    const about = new Adw.AboutDialog();
    about.applicationName = info.applicationName;
    about.applicationIcon = info.applicationIcon;
    about.version = __APP_VERSION__;
    about.developerName = info.developerName;
    about.comments = commentsWithEdition(info.comments);
    about.website = info.website;
    about.issueUrl = info.issueUrl;
    about.license = info.license;
    this.root.appendChild(about);
    return about;
  }

  /**
   * Attach the shell to the document, then wire the controller. The layout MUST be mounted after the
   * tree is connected: a freshly created Adw.ViewStack rebuilds its pages from declared children on
   * connect, which would wipe imperatively-added pages.
   */
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.root);

    editorController.setCode(DEMO_PROGRAM);
    mainStateController.setCodeChanged(false);

    const controller = new MainWindowController(
      this.shell,
      {
        editor: this.editorView,
        gameConsole: this.gameConsoleView,
        learn: this.learnView,
        debugger: this.debuggerView,
        // The header carries the run controls, so there is no floating main button to update
        mainButton: { updateFromSimulatorState: (state) => mainStateController.updateFromSimulatorState(state) },
      },
      this.createServices()
    );
    this.controller = controller;
    controller.init();
    this.fileService.setUnsavedChanges(false);
    this.updateRunButtons();
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
      notifier: { show: ({ title, timeout }) => this.toastOverlay.addToast(title, { timeout }) },
      // The Editor's 6502 quick-help sheet is the web app's help
      showHelp: () => {
        this.controller?.navigateToView(ViewType.EDITOR);
        editorController.setHelpVisible(true);
      },
      showShareDialog: () => window.open(SHARE_URL, "_blank", "noopener,noreferrer"),
      submitExample: () => window.open(SHARE_URL, "_blank", "noopener,noreferrer"),
    };
  }

  // --- DOM construction ---

  private buildChrome(): void {
    const toolbarView = new Adw.ToolbarView();

    // --- Header bar (slot=top) ---
    const header = new Adw.HeaderBar();
    header.setAttribute("slot", "top");

    this.configureIconButton(this.sidebarToggle, "sidebar-show", "Toggle Sidebar");
    this.sidebarToggle.setAttribute("slot", "start");
    this.sidebarToggle.hidden = true;

    this.configureIconButton(this.learnBackButton, "go-previous", "Back");
    this.learnBackButton.setAttribute("slot", "start");
    this.learnBackButton.hidden = true; // shown only when a Learn subpage is open
    this.learnBackButton.addEventListener("click", () => this.learnView.navigateBack());

    this.runControls.className = "shell-run-controls";
    this.runControls.setAttribute("slot", "start");
    this.addRunButton("Assemble", ["assemble"], "suggested");
    this.addRunButton("Run", ["run-simulator", "resume-simulator"]);
    this.addRunButton("Pause", ["pause-simulator"]);
    this.addRunButton("Step", ["step-simulator"]);
    this.addRunButton("Reset", ["reset-simulator"]);
    this.shell.onActionsChanged(() => this.updateRunButtons());

    this.titleWidget.setAttribute("slot", "center");
    this.titleWidget.setAttribute("title", "Learn 6502 Assembly");

    const menuButton = new Gtk.MenuButton();
    menuButton.setAttribute("slot", "end");
    menuButton.menuTitle = "Main Menu";
    // The model is typed against GJS (`Gio.Menu`); the element takes its portable twin.
    menuButton.menuModel = createMainMenu() as unknown as typeof menuButton.menuModel;

    header.append(this.sidebarToggle, this.learnBackButton, this.runControls, this.titleWidget, menuButton);

    // --- Content (unslotted): toast overlay > layout host ---
    this.toastOverlay.appendChild(this.shell.layoutHost);

    // --- Bottom: view switcher bar ---
    this.switcherBar.setAttribute("slot", "bottom");

    toolbarView.append(header, this.toastOverlay, this.switcherBar);
    this.root.appendChild(toolbarView);
  }

  private configureIconButton(button: Gtk.Button, icon: string, tooltip: string): void {
    button.setAttribute("icon", icon);
    button.setAttribute("tooltip", tooltip);
    button.setAttribute("flat", "");
  }

  private addRunButton(label: string, actions: string[], variant?: "suggested"): void {
    const button = new Gtk.Button();
    button.setAttribute("label", label);
    if (variant) button.setAttribute(variant, "");
    // The first enabled action wins: run and resume both start the program
    button.addEventListener("click", () => {
      const action = actions.find((name) => this.shell.isActionEnabled(name));
      if (action) this.shell.activate(action);
    });
    this.runButtons.push({ button, actions });
    this.runControls.appendChild(button);
  }

  private updateRunButtons(): void {
    for (const { button, actions } of this.runButtons) {
      if (actions.some((name) => this.shell.isActionEnabled(name))) button.removeAttribute("disabled");
      else button.setAttribute("disabled", "");
    }
  }
}
