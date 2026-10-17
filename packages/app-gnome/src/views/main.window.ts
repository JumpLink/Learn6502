import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";

import { gameConsoleController } from "@learn6502/common-ui";
import type { Memory } from "@learn6502/core";
import {
  MainWindowController,
  createMainMenu,
  notificationService,
  type Debugger,
  type Editor,
  type GameConsole,
  type Learn,
  type MainButton,
  type MainWindowServices,
  ShareDialog,
  themeService,
} from "@learn6502/ui";

import { HelpWindow } from "./help.window.ts";
import { GtkMainWindowShell } from "./main.window.shell.ts";
import { copyToClipboard } from "../utils.ts";
import { fileService } from "../services";
import { settings } from "../settings.ts";
import { watchFirstChapter } from "../support-prompt.ts";

import Template from "./main.window.blp";

/** The GNOME shell around the shared `MainWindowController`: the template, the services and the keyboard. */
export class MainWindow extends Adw.ApplicationWindow {
  declare private _editor: Editor;
  declare private _gameConsole: GameConsole;
  declare private _learn: Learn;
  declare private _mainButton: MainButton;
  declare private _stack: Adw.ViewStack;
  declare private _switcherBar: Adw.ViewSwitcherBar;
  declare private _debugger: Debugger;
  declare private _toastOverlay: Adw.ToastOverlay;
  declare private _layoutHost: Gtk.Stack;
  declare private _unsavedChangesDialog: Adw.AlertDialog;
  declare private _titleLabel: Gtk.Label;
  declare private _unsavedChangesIndicator: Gtk.Button;
  declare private _learnBackButton: Gtk.Button;
  declare private _menuButton: Gtk.MenuButton;
  declare private _leftSidebar: Adw.OverlaySplitView;
  declare private _leftColumn: Gtk.Box;
  declare private _centerColumn: Gtk.Box;
  declare private _rightTopBox: Gtk.Box;
  declare private _rightBottomBox: Gtk.Box;

  static {
    GObject.registerClass(
      {
        GTypeName: "MainWindow",
        Template,
        Properties: {
          "desktop-mode": GObject.ParamSpec.boolean(
            "desktop-mode",
            "Desktop Mode",
            "True when window is in desktop (three-column) layout",
            GObject.ParamFlags.READWRITE,
            false
          ),
        },
        InternalChildren: [
          "editor",
          "gameConsole",
          "learn",
          "mainButton",
          "stack",
          "switcherBar",
          "debugger",
          "toastOverlay",
          "layoutHost",
          "leftSidebar",
          "leftColumn",
          "centerColumn",
          "rightColumn",
          "rightColumnContent",
          "rightTopBox",
          "rightBottomBox",
          "unsavedChangesDialog",
          "titleLabel",
          "unsavedChangesIndicator",
          "sidebarToggleButton",
          "learnBackButton",
          "menuButton",
        ],
      },
      this
    );
  }

  private _onLearnBackButtonClicked(): void {
    this._learn.navigateBack();
  }

  constructor(application: Adw.Application) {
    super({ application });

    this._menuButton.set_menu_model(createMainMenu({ preferences: true }));
    fileService.init(this);
    notificationService.init(this, this._toastOverlay);
    // Register this window to receive mode/accent classes automatically
    themeService.registerThemedWidget(this);

    const screens = {
      editor: this._editor,
      gameConsole: this._gameConsole,
      learn: this._learn,
      debugger: this._debugger,
    };
    new MainWindowController(
      new GtkMainWindowShell(this, {
        ...screens,
        stack: this._stack,
        switcherBar: this._switcherBar,
        layoutHost: this._layoutHost,
        leftSidebar: this._leftSidebar,
        leftColumn: this._leftColumn,
        centerColumn: this._centerColumn,
        rightTopBox: this._rightTopBox,
        rightBottomBox: this._rightBottomBox,
        unsavedChangesDialog: this._unsavedChangesDialog,
        titleLabel: this._titleLabel,
        unsavedChangesIndicator: this._unsavedChangesIndicator,
        learnBackButton: this._learnBackButton,
      }),
      { ...screens, mainButton: this._mainButton },
      this.createServices()
    ).init();

    this.setupKeyboardListener();
    watchFirstChapter(this, this._learn.scrolledWindows[0]);
  }

  private createServices(): MainWindowServices {
    return {
      files: {
        openFile: () => fileService.openFile(),
        saveFile: async (content) => (await fileService.saveFile(content)) || false,
        saveFileAs: (content, suggestedName) => fileService.saveFileAs(content, suggestedName),
        getCurrentFileName: () => fileService.getCurrentFileName() || "",
        hasCurrentFile: () => fileService.getCurrentGioFile() !== null,
        hasUnsavedChanges: () => fileService.hasUnsavedChanges(),
        setUnsavedChanges: (hasChanges) => fileService.setUnsavedChanges(hasChanges),
      },
      settings: {
        getInt: (key) => settings.get_int(key),
        setInt: (key, value) => settings.set_int(key, value),
        getBoolean: (key) => settings.get_boolean(key),
        setBoolean: (key, value) => settings.set_boolean(key, value),
      },
      clipboard: { copy: (text) => copyToClipboard(text, this.get_clipboard()) },
      notifier: { show: (options) => notificationService.showNotification(options) },
      showHelp: () => new HelpWindow().present(),
      showShareDialog: (code, memory) => this.presentShareDialog(code, memory),
      submitExample: (code, memory) => this.presentShareDialog(code, memory),
    };
  }

  private presentShareDialog(code: string, memory: Memory): void {
    const dialog = new ShareDialog();
    dialog.setCode(code);
    dialog.setMemory(memory);
    dialog.connect("submit", (submitted: ShareDialog) => {
      console.log("Example submitted:", submitted.submittedExample);
      // TODO: Implement GitHub PR creation logic here
      notificationService.showNotification({
        // TRANSLATORS: Toast message when example is submitted
        title: _("Example submitted for review"),
        timeout: 3,
      });
    });
    dialog.present(this);
  }

  private setupKeyboardListener(): void {
    const keyController = new Gtk.EventControllerKey();
    this.add_controller(keyController);

    keyController.connect("key-pressed", (_controller: Gtk.EventControllerKey, keyval: number) => {
      return gameConsoleController.handleKeyPress(keyval);
    });

    gameConsoleController.registerKeyMappings({
      [Gdk.KEY_w]: "Up",
      [Gdk.KEY_s]: "Down",
      [Gdk.KEY_a]: "Left",
      [Gdk.KEY_d]: "Right",
      [Gdk.KEY_Up]: "Up",
      [Gdk.KEY_Down]: "Down",
      [Gdk.KEY_Left]: "Left",
      [Gdk.KEY_Right]: "Right",
      [Gdk.KEY_Return]: "A",
      [Gdk.KEY_q]: "A",
      [Gdk.KEY_space]: "B",
      [Gdk.KEY_e]: "B",
    });
  }
}

GObject.type_ensure(MainWindow.$gtype);
