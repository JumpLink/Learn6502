import type { Page, EventData, View } from "@nativescript/core";
import { Application, GridLayout, ItemSpec } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";

import { systemStates, SystemStates } from "~/states";

// Adwaita native widgets
import {
  Adw,
  Gtk,
  MENU_ITEM_ACTIVATED,
  NOTIFY_VISIBLE_CHILD,
  setAdwaitaColorScheme,
} from "@gjsify/adwaita-nativescript";
import { openMenuSymbolic, documentEditSymbolic } from "@gjsify/adwaita-icons/actions";
import { accessoriesDictionarySymbolic } from "@gjsify/adwaita-icons/legacy";
import { applicationsEngineeringSymbolic, applicationsGamesSymbolic } from "@gjsify/adwaita-icons/categories";

// Common interfaces and controllers
import type { MainView } from "@learn6502/common-ui";
import {
  ViewType,
  gameConsoleController,
  debuggerController,
  mainStateController,
  editorController,
  GameConsoleEventBridge,
  MainEventBridge,
  MainButtonState,
} from "@learn6502/common-ui";
import type { SimulatorState } from "@learn6502/core";

// Services / utils
import { notificationService } from "~/services";
import type { SystemAppearanceChangeEvent } from "~/types";
import { showError, logger } from "~/utils";
import { setAppBackHandler } from "~/utils/navigation";

// Adwaita FAB + screen builders
import { AdwMainButton, type MainButtonAction } from "~/widgets/adw-main-button";
import type { ScreenModule } from "./main/editor";
import { buildEditorScreen } from "./main/editor";
import { buildLearnScreen } from "./main/learn";
import { buildDebuggerScreen, debuggerView } from "./main/debugger";
import { buildGameConsoleScreen, gameConsoleView } from "./main/game-console";

/** Notification key -> user-facing title. */
const NOTIFICATION_TITLES: Record<string, string> = {
  "assembled-successfully": "Assembled successfully",
  "assemble-failed": "Assemble failed",
  "simulator-failure": "Simulator failure",
  "labels-failure": "Labels failure",
  "code-copied-to-editor": "Code copied to editor",
  "program-completed": "Program completed",
};

/** Adw.ViewStack page name <-> ViewType. */
const VIEW_TO_NAME: Partial<Record<ViewType, string>> = {
  [ViewType.LEARN]: "learn",
  [ViewType.EDITOR]: "code",
  [ViewType.DEBUGGER]: "debug",
  [ViewType.GAME_CONSOLE]: "play",
};
const NAME_TO_VIEW: Record<string, ViewType> = {
  learn: ViewType.LEARN,
  code: ViewType.EDITOR,
  debug: ViewType.DEBUGGER,
  play: ViewType.GAME_CONSOLE,
};

/**
 * MainController — builds the Adwaita shell (Adw.ToolbarView: header bar + a
 * bottom Adw.ViewSwitcherBar driving an Adw.ViewStack of the four screens, with an
 * Adwaita FAB overlaid). Implements MainView; all 6502 logic stays in the
 * common-ui controllers + event bridges (wired identically to the Material shell).
 */
export class MainController implements MainView {
  private page: Page | null = null;

  private _stack: Adw.ViewStack | null = null;
  private _fab: AdwMainButton | null = null;
  private _toast: Adw.ToastOverlay | null = null;
  private _about: Adw.AboutDialog | null = null;
  private _screens: Record<string, ScreenModule> = {};
  private _currentName: string | null = null;

  private _activeView: ViewType = ViewType.EDITOR;
  private log = logger.scoped("MainController");

  private gameConsoleBridge: GameConsoleEventBridge;
  private mainBridge: MainEventBridge;

  get state(): SimulatorState {
    return gameConsoleView.simulator.state;
  }

  get activeView(): ViewType {
    return this._activeView;
  }

  constructor() {
    this.log.debug("Initialized");
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);

    this.gameConsoleBridge = new GameConsoleEventBridge({
      formatAndLog: (message, params) => {
        try {
          debuggerController.log(_(message, ...(params ?? []).map(String)));
        } catch (error) {
          this.log.error(`Failed to localize message "${message}":`, error);
          debuggerController.log(message);
        }
      },
      updateDebugger: () => {
        if (gameConsoleView.memory && gameConsoleView.simulator) {
          debuggerView.update(gameConsoleView.memory, gameConsoleView.simulator);
        }
      },
      updateAssemblerViews: (assembler) => {
        debuggerView.updateHexdump(assembler);
        debuggerView.updateDisassembled(assembler);
      },
      updateUiState: () => {
        this.updateMainUiState();
      },
      showNotification: (key) => {
        notificationService.showNotification({ title: _(NOTIFICATION_TITLES[key] || key), timeout: 2 });
      },
      updateDebugInfo: (simulator) => {
        debuggerView.updateDebugInfo(simulator);
      },
    });

    this.mainBridge = new MainEventBridge({
      mainView: this,
      onStateChanged: () => {
        this.updateMainUiState();
      },
      onLearnCodeCopied: (code) => {
        this.log.debug("Learn: Code copied to editor", code);
      },
      showNotification: (key) => {
        notificationService.showNotification({ title: _(NOTIFICATION_TITLES[key] || key), timeout: 2 });
      },
    });
  }

  // --- Lifecycle ---
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    // Follow the OS color scheme for the symbolic-icon bitmaps (CSS .ns-dark is
    // handled by NS; this keeps the pre-coloured icons in sync). Seed at mount.
    try {
      setAdwaitaColorScheme(Application.systemAppearance() === "dark" ? "dark" : "light");
    } catch {
      /* systemAppearance unavailable — default light */
    }

    systemStates.events.on(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);

    this.setupAndroidKeyHandling();
    this.initializeGameConsoleController();

    this.gameConsoleBridge.connect();
    this.mainBridge.connect();

    mainStateController.init();

    // Build the Adwaita shell and install it as the page content.
    this.page.content = this.buildShell();

    // Hardware back: let the active screen consume it (e.g. the Learn screen pops
    // its internal Adw.NavigationView). Registered with the global back handler so
    // it runs before the default Frame / move-to-background logic.
    setAppBackHandler(() => {
      const screen = this._currentName ? this._screens[this._currentName] : undefined;
      return screen?.onBack?.() ?? false;
    });

    // Start on the editor (the Material default).
    this.navigateToView(ViewType.EDITOR);
  }

  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    this.log.debug("unloaded:", view.id);
    setAppBackHandler(null);
    this.gameConsoleBridge.disconnect();
    this.mainBridge.disconnect();
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
    const toolbar = new Adw.ToolbarView();

    // Header bar: title + app menu.
    const header = new Adw.HeaderBar();
    const title = new Adw.WindowTitle();
    title.title = "Learn6502";
    header.setTitleWidget(title);

    const menu = new Gtk.MenuButton();
    menu.iconName = openMenuSymbolic;
    menu.menuTitle = "Learn6502";
    menu.menuModel = [
      { id: "about", label: _("About Learn 6502 Assembly") },
      { id: "help", label: _("Help") },
      { id: "quit", label: _("Quit") },
    ];
    menu.addEventListener(MENU_ITEM_ACTIVATED, (e) => {
      const id = (e as unknown as { id: string }).id;
      this.onMenuItem(id);
    });
    header.packEnd(menu);
    toolbar.addTopBar(header);

    // Stack of the four screens.
    const stack = new Adw.ViewStack();
    this._stack = stack;
    const learn = buildLearnScreen();
    const code = buildEditorScreen();
    const debug = buildDebuggerScreen();
    const play = buildGameConsoleScreen();
    this._screens = { learn, code, debug, play };
    stack.add(learn.view, "learn", _("Learn"), accessoriesDictionarySymbolic);
    stack.add(code.view, "code", _("Code"), documentEditSymbolic);
    stack.add(debug.view, "debug", _("Debug"), applicationsEngineeringSymbolic);
    stack.add(play.view, "play", _("Play"), applicationsGamesSymbolic);
    stack.addEventListener(NOTIFY_VISIBLE_CHILD, () => this.onStackChanged(stack.visibleChildName));

    // Content = a toast overlay wrapping [stack + FAB].
    const overlay = new GridLayout();
    overlay.addRow(new ItemSpec(1, "star"));
    overlay.addColumn(new ItemSpec(1, "star"));
    GridLayout.setRow(stack, 0);
    GridLayout.setColumn(stack, 0);
    overlay.addChild(stack);

    const fab = new AdwMainButton();
    fab.horizontalAlignment = "right";
    fab.verticalAlignment = "bottom";
    fab.onAction = (action) => this.onFabAction(action);
    this._fab = fab;
    GridLayout.setRow(fab, 0);
    GridLayout.setColumn(fab, 0);
    overlay.addChild(fab);

    // About dialog — an in-page modal card painted over everything (last child of
    // the overlay grid), revealed from the app menu. Mirrors the GNOME app's
    // Adw.AboutDialog.new_from_appdata(metainfo, version).
    const about = new Adw.AboutDialog();
    about.applicationName = _("Learn 6502 Assembly");
    about.version = __APP_VERSION__;
    about.developerName = "Pascal Garber";
    about.comments = _("Program vintage game consoles");
    about.website = "https://flathub.org/apps/eu.jumplink.Learn6502";
    this._about = about;
    GridLayout.setRow(about, 0);
    GridLayout.setColumn(about, 0);
    overlay.addChild(about);

    const toast = new Adw.ToastOverlay();
    toast.setContent(overlay);
    this._toast = toast;
    toolbar.setContent(toast);

    // Bottom view switcher bar bound to the stack.
    const switcher = new Adw.ViewSwitcherBar();
    switcher.setStack(stack);
    toolbar.addBottomBar(switcher);

    return toolbar;
  }

  // --- Navigation ---
  public navigateToView(viewType: ViewType): void {
    if (!this._stack) return;
    const name = VIEW_TO_NAME[viewType];
    if (!name) return;
    this._stack.visibleChildName = name; // fires notify::visible-child if changed
    this.onStackChanged(name); // covers the already-on-that-view case
  }

  private onStackChanged(name: string): void {
    const viewType = NAME_TO_VIEW[name] ?? ViewType.EDITOR;
    if (name !== this._currentName) {
      if (this._currentName) this._screens[this._currentName]?.onHide?.();
      this._screens[name]?.onShow?.();
      this._currentName = name;
    }
    this._activeView = viewType;
    mainStateController.setViewType(viewType);
    this.updateMainUiState();
  }

  // --- MainView implementation ---
  public assembleGameConsole(): void {
    this.navigateToView(ViewType.DEBUGGER);
    const code = editorController.code;
    mainStateController.setCodeChanged(false);
    gameConsoleController.assemble(code);
  }

  public runGameConsole(): void {
    this.navigateToView(ViewType.GAME_CONSOLE);
    gameConsoleView.run();
  }

  public pauseGameConsole(): void {
    gameConsoleView.stop();
  }

  public reset(): void {
    debuggerView.reset();
    gameConsoleView.reset();
  }

  public stepGameConsole(): void {
    this.navigateToView(ViewType.DEBUGGER);
    if (!gameConsoleView.simulator.stepperEnabled) {
      gameConsoleView.simulator.enableStepper();
    }
    gameConsoleView.simulator.debugExecStep();
    this.updateMainUiState();
  }

  public setEditorCode(code: string): void {
    this.navigateToView(ViewType.EDITOR);
    editorController.setCode(code);
    mainStateController.setCodeChanged(false);
  }

  // --- FAB / menu handlers ---
  private onFabAction(action: MainButtonAction): void {
    switch (action) {
      case "assemble":
        mainStateController.emitAssemble();
        break;
      case "run":
        mainStateController.emitRun();
        break;
      case "pause":
        mainStateController.emitPause();
        break;
      case "resume":
        mainStateController.emitResume();
        break;
      case "reset":
        mainStateController.emitReset();
        break;
      case "step":
        mainStateController.emitStep();
        break;
    }
  }

  private onMenuItem(id: string): void {
    switch (id) {
      case "about":
        this._about?.present();
        break;
      case "help":
        this.navigateToView(ViewType.LEARN);
        break;
      case "quit":
        Application.android?.foregroundActivity?.finish();
        break;
    }
  }

  private updateMainUiState(): void {
    if (!this._fab) return;
    let state = mainStateController.updateFromSimulatorState(this.state);
    // The action button is hidden on the Learn screen (matching the GNOME app).
    if (this._activeView === ViewType.LEARN) state = MainButtonState.HIDDEN;
    this._fab.setState(state);
  }

  // --- Setup helpers (unchanged from the Material shell) ---
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

    gameConsoleController.on("keyPressed", (event) => {
      this.log.debug("Gamepad key pressed:", event.key, event.keyCode);
    });
  }

  private initializeGameConsoleController(): void {
    gameConsoleController.initPartial({
      memory: gameConsoleView.memory,
      simulator: gameConsoleView.simulator,
      assembler: gameConsoleView.assembler,
      labels: gameConsoleView.labels,
    });
  }
}

// Singleton + bound exports for the XML.
const mainController = new MainController();
export const onLoaded = mainController.onLoaded.bind(mainController);
export const onUnloaded = mainController.onUnloaded.bind(mainController);
