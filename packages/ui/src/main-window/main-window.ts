import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";

import type { Debugger } from "../debugger/debugger.ts";
import type { Editor } from "../editor/editor.ts";
import type { GameConsole } from "../game-console/game-console.ts";
import type { Learn } from "../learn/learn.ts";
import type { MainButton } from "../main-button.ts";
import { notificationService } from "../notification.service.ts";
import { themeService } from "../preferences/theme.service.ts";
import { createMainMenu } from "./menu.ts";
import { MainWindowController } from "./main-window-controller.ts";
import { createMainWindowPlatform } from "./main-window.services.ts";
import { WindowShell } from "./window-shell.ts";

import Template from "./main-window.blp?template";

/**
 * The one main window of every app. The template holds the shell; the screens (`$Learn`, `$Editor`,
 * `$Debugger`, `$GameConsole`) and the unsaved-changes dialog are siblings of it, which
 * `InternalChildren` still resolves. What differs per platform — files, clipboard, help, the app
 * actions, the keys — comes from `main-window.services.ts` and its `.android.ts` / `.web.ts` siblings.
 */
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
  declare private _rightColumnContent: Gtk.Box;

  private controller: MainWindowController | null = null;

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

    this._menuButton.menu_model = createMainMenu({ preferences: true });
    notificationService.init(this, this._toastOverlay);
    // Register this window to receive mode/accent classes automatically
    themeService.registerThemedWidget(this);

    const screens = {
      editor: this._editor,
      gameConsole: this._gameConsole,
      learn: this._learn,
      debugger: this._debugger,
    };
    const platform = createMainWindowPlatform({
      window: this,
      application,
      screens,
      navigateToView: (view) => this.controller?.navigateToView(view),
    });
    const shell = new WindowShell(
      this,
      {
        ...screens,
        stack: this._stack,
        switcherBar: this._switcherBar,
        layoutHost: this._layoutHost,
        leftSidebar: this._leftSidebar,
        leftColumn: this._leftColumn,
        centerColumn: this._centerColumn,
        rightTopBox: this._rightTopBox,
        rightBottomBox: this._rightBottomBox,
        rightColumnContent: this._rightColumnContent,
        unsavedChangesDialog: this._unsavedChangesDialog,
        titleLabel: this._titleLabel,
        unsavedChangesIndicator: this._unsavedChangesIndicator,
        learnBackButton: this._learnBackButton,
      },
      { initialView: platform.initialView }
    );
    platform.bindShell?.(shell);
    const controller = new MainWindowController(
      shell,
      { ...screens, mainButton: this._mainButton, simulatorStack: platform.simulatorStack },
      platform.services
    );
    this.controller = controller;
    platform.whenReady(() => {
      controller.init();
      platform.started?.();
    });
  }
}

GObject.type_ensure(MainWindow.$gtype);
