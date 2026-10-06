import type { Page, EventData, View } from "@nativescript/core";
import { Application, GridLayout } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";

import { systemStates, SystemStates } from "~/states";

// Adwaita native widgets
import {
  Adw,
  Gio,
  Gtk,
  NOTIFY_VISIBLE_CHILD,
  insertActionGroup,
  setAdwaitaColorScheme,
} from "@gjsify/adwaita-nativescript";
import { buildWithSiblings } from "@gjsify/adwaita-nativescript/builder";
// The tab icons are the GNOME app's own (school / code / bug / nintendo-controller).
import { schoolSymbolic, codeSymbolic, bugSymbolic, nintendoControllerSymbolic } from "~/icons";
// The GNOME app's own main window Blueprint, built by the shared-tree builder: its `Adw.Breakpoint`s
// move the four screens between the view stack and the three columns.
import mainWindowTree from "../../../app-gnome/src/views/main.window.blp?shared-tree";

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
import { translate } from "~/utils/translate";

// The template classes main.window.blp names; importing a module registers its class.
import "~/widgets/main-button";
import "~/widgets/menu-button";
import "~/widgets/toolbar";
import type { MainButton } from "~/widgets/main-button";
import type { MenuButton } from "~/widgets/menu-button";
import { createScreens, type Screens } from "./main/screens";
import { learnView } from "./main/learn";
import { debuggerView } from "./main/debugger";
import { gameConsoleView } from "./main/game-console";

/** Notification key -> user-facing title. */
const NOTIFICATION_TITLES: Record<string, string> = {
  "assembled-successfully": "Assembled successfully",
  "assemble-failed": "Assemble failed",
  "simulator-failure": "Simulator failure",
  "labels-failure": "Labels failure",
  "code-copied-to-editor": "Code copied to editor",
  "program-completed": "Program completed",
};

/** The four screens, in the order the stack lists them, with their tab title and icon. */
const STACK_PAGES: { id: keyof Screens; view: ViewType; title: () => string; icon: string }[] = [
  { id: "learn", view: ViewType.LEARN, title: () => _("Learn"), icon: schoolSymbolic },
  { id: "editor", view: ViewType.EDITOR, title: () => _("Code"), icon: codeSymbolic },
  { id: "debugger", view: ViewType.DEBUGGER, title: () => _("Debug"), icon: bugSymbolic },
  { id: "gameConsole", view: ViewType.GAME_CONSOLE, title: () => _("Play"), icon: nintendoControllerSymbolic },
];

/** Names of the `win` actions, as `main-button.blp` and `toolbar.blp` spell them. */
const WIN_ACTIONS = [
  "assemble",
  "run-simulator",
  "resume-simulator",
  "pause-simulator",
  "reset-simulator",
  "step-simulator",
  "share",
] as const;
type WinAction = (typeof WIN_ACTIONS)[number];

/**
 * MainController — the window shell, built from the GNOME app's `main.window.blp`: header bar, a
 * view stack with a bottom switcher bar on narrow windows, three columns beside a run toolbar on
 * wide ones, the main button over it all. Its `Adw.Breakpoint`s decide which; this class moves the
 * four screens between the stack and the columns when they do, as the GNOME window does. Implements
 * MainView; all 6502 logic stays in the common-ui controllers + event bridges.
 */
export class MainController implements MainView {
  private page: Page | null = null;

  private _window: View | null = null;
  private _stack: Adw.ViewStack | null = null;
  private _layoutHost: Gtk.Stack | null = null;
  private _switcherBar: Adw.ViewSwitcherBar | null = null;
  private _leftColumn: Gtk.Box | null = null;
  private _centerColumn: Gtk.Box | null = null;
  private _rightTopBox: Gtk.Box | null = null;
  private _rightBottomBox: Gtk.Box | null = null;
  private _learnBackButton: Gtk.Button | null = null;
  private _mainButton: MainButton | null = null;
  private _about: Adw.AboutDialog | null = null;
  private _screens: Screens | null = null;
  private readonly _actions = new Map<WinAction, Gio.SimpleAction>();
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

  /** Whether the breakpoints have put the screens in columns (the GNOME window's `three`). */
  private get threeColumns(): boolean {
    return this._layoutHost?.visibleChildName === "three";
  }

  constructor() {
    this.log.debug("Initialized");
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
    this.onLearnSubpageChanged = this.onLearnSubpageChanged.bind(this);

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
    learnView.events.on("subpage-changed", this.onLearnSubpageChanged);

    this.setupAndroidKeyHandling();
    this.initializeGameConsoleController();

    this.gameConsoleBridge.connect();
    this.mainBridge.connect();

    mainStateController.init();

    // Build the shell from main.window.blp and install it as the page content.
    this.page.content = this.buildShell();

    // Hardware back: let the visible screens consume it (e.g. the Learn screen pops its internal
    // Adw.NavigationView). Registered with the global back handler so it runs before the default
    // Frame / move-to-background logic.
    setAppBackHandler(() => {
      const screens = this._screens;
      if (!screens) return false;
      if (this.threeColumns) return screens.learn.onBack?.() ?? false;
      const current = STACK_PAGES.find((page) => page.id === this._currentName);
      return current ? (screens[current.id].onBack?.() ?? false) : false;
    });

    // Start on the editor, the default screen.
    this.navigateToView(ViewType.EDITOR);
  }

  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    this.log.debug("unloaded:", view.id);
    setAppBackHandler(null);
    this.gameConsoleBridge.disconnect();
    this.mainBridge.disconnect();
    systemStates.events.off(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);
    learnView.events.off("subpage-changed", this.onLearnSubpageChanged);
  }

  /** Learn's navigation stack changed — re-evaluate the header back button. */
  private onLearnSubpageChanged(): void {
    this.updateLearnBackButtonVisibility();
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
    this._screens = createScreens();

    const { root } = buildWithSiblings(mainWindowTree, {
      // `clicked => $_onLearnBackButtonClicked()` in the blueprint.
      scope: { _onLearnBackButtonClicked: () => learnView.navigateBack() },
      translate,
    });
    this._window = root;
    const byId = <T>(id: string): T => root.getViewById<View>(id) as unknown as T;

    this._stack = byId<Adw.ViewStack>("stack");
    this._layoutHost = byId<Gtk.Stack>("layoutHost");
    this._switcherBar = byId<Adw.ViewSwitcherBar>("switcherBar");
    this._leftColumn = byId<Gtk.Box>("leftColumn");
    this._centerColumn = byId<Gtk.Box>("centerColumn");
    this._rightTopBox = byId<Gtk.Box>("rightTopBox");
    this._rightBottomBox = byId<Gtk.Box>("rightBottomBox");
    this._learnBackButton = byId<Gtk.Button>("learnBackButton");
    this._mainButton = byId<MainButton>("mainButton");

    byId<MenuButton>("menuButton").onActivated = (id) => this.onMenuItem(id);

    this.setupActions(root);
    this.setupAbout(root);

    this._stack.addEventListener(NOTIFY_VISIBLE_CHILD, () => this.onStackChanged(this._stack!.visibleChildName));
    this._layoutHost.connect("notify::visible-child-name", () => this.mountLayout());
    this.mountLayout();

    return root;
  }

  /** The `win` action group the main button and the run toolbar fire (their `action-name`s). */
  private setupActions(root: View): void {
    const group = new Gio.SimpleActionGroup();
    const handlers: Record<WinAction, () => void> = {
      assemble: () => mainStateController.emitAssemble(),
      "run-simulator": () => mainStateController.emitRun(),
      "resume-simulator": () => mainStateController.emitResume(),
      "pause-simulator": () => mainStateController.emitPause(),
      "reset-simulator": () => mainStateController.emitReset(),
      "step-simulator": () => mainStateController.emitStep(),
      share: () => this.shareCode(),
    };
    for (const name of WIN_ACTIONS) {
      const action = new Gio.SimpleAction({ name });
      action.connect("activate", handlers[name]);
      group.add_action(action);
      this._actions.set(name, action);
    }
    insertActionGroup(root, "win", group);
  }

  /**
   * About dialog — an in-page modal card painted over everything (the window's last child),
   * revealed from the app menu. Mirrors the GNOME app's Adw.AboutDialog.new_from_appdata(metainfo,
   * version).
   */
  private setupAbout(root: View): void {
    const about = new Adw.AboutDialog();
    about.applicationName = _("Learn 6502 Assembly");
    about.version = __APP_VERSION__;
    about.developerName = "Pascal Garber";
    about.comments = _("Program vintage game consoles");
    about.website = "https://flathub.org/apps/eu.jumplink.Learn6502";
    this._about = about;
    GridLayout.setRow(about, 0);
    GridLayout.setColumn(about, 0);
    (root as GridLayout).addChild(about);
  }

  // --- Layout: the stack on narrow windows, the columns on wide ones ---

  /** Put the four screens where the current layout wants them, as the GNOME window does. */
  private mountLayout(): void {
    if (this.threeColumns) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
    this.updateLearnBackButtonVisibility();
    this.updateMainUiState();
  }

  /** Detach a screen from whichever container holds it, ready for the other layout. */
  private detach(view: View): void {
    const parent = view.parent as unknown as { remove?: (child: View) => unknown; removeChild?: (v: View) => void };
    if (!parent) return;
    if (parent === (this._stack as unknown)) this._stack!.remove(view);
    else if (typeof parent.remove === "function") parent.remove(view);
    else parent.removeChild?.(view);
  }

  private mountSingleLayout(): void {
    const stack = this._stack!;
    const screens = this._screens!;
    const keep = this._currentName ?? STACK_PAGES[1]!.id;
    for (const page of STACK_PAGES) this.detach(screens[page.id].view);
    for (const page of STACK_PAGES) stack.add(screens[page.id].view, page.id, page.title(), page.icon);
    this._switcherBar!.set_stack(stack);
    this._currentName = null;
    stack.visibleChildName = keep;
    this.onStackChanged(stack.visibleChildName);
  }

  private mountThreeColumnLayout(): void {
    const screens = this._screens!;
    for (const page of STACK_PAGES) this.detach(screens[page.id].view);
    // A box hands spare space only to a child that asks for it, and the screens are plain views.
    for (const page of STACK_PAGES) Object.assign(screens[page.id].view, { hexpand: true, vexpand: true });
    this._leftColumn!.append(screens.learn.view);
    this._centerColumn!.append(screens.editor.view);
    this._rightTopBox!.append(screens.gameConsole.view);
    this._rightBottomBox!.append(screens.debugger.view);
    // No bottom bar in columns; the screens are all on show.
    this._switcherBar!.set_stack(null);
    this._currentName = null;
    for (const page of STACK_PAGES) screens[page.id].onShow?.();
    this._activeView = ViewType.EDITOR;
    mainStateController.setViewType(ViewType.EDITOR);
  }

  // --- Navigation ---
  public navigateToView(viewType: ViewType): void {
    // In columns every screen is on show already.
    if (this.threeColumns || !this._stack) return;
    const page = STACK_PAGES.find((candidate) => candidate.view === viewType);
    if (!page) return;
    this._stack.visibleChildName = page.id; // fires notify::visible-child if changed
    this.onStackChanged(page.id); // covers the already-on-that-view case
  }

  private onStackChanged(name: string): void {
    const page = STACK_PAGES.find((candidate) => candidate.id === name);
    if (!page || !this._screens || this.threeColumns) return;
    if (name !== this._currentName) {
      if (this._currentName) this._screens[this._currentName as keyof Screens]?.onHide?.();
      this._screens[page.id].onShow?.();
      this._currentName = name;
    }
    this._activeView = page.view;
    mainStateController.setViewType(page.view);
    this.updateMainUiState();
    this.updateLearnBackButtonVisibility();
  }

  /** Show the header back button only while Learn has a subpage open and is on screen: in columns
   *  always, in the stack only while its tab is the active one (as in the GNOME window). */
  private updateLearnBackButtonVisibility(): void {
    if (!this._learnBackButton) return;
    const learnOnScreen = this.threeColumns || this._activeView === ViewType.LEARN;
    const visible = learnOnScreen && learnView.hasVisibleSubpage;
    this._learnBackButton.visibility = visible ? "visible" : "collapsed";
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

  // --- Menu / share handlers ---
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

  /** Hand the editor's code to the Android share sheet; GNOME opens its own share dialog instead. */
  private shareCode(): void {
    const activity = Application.android?.foregroundActivity;
    const code = editorController.code;
    if (!activity || !code) return;
    const intent = new android.content.Intent(android.content.Intent.ACTION_SEND);
    intent.setType("text/plain");
    intent.putExtra(android.content.Intent.EXTRA_TEXT, code);
    activity.startActivity(android.content.Intent.createChooser(intent, _("Share")));
  }

  private updateMainUiState(): void {
    if (!this._mainButton) return;
    const simulatorState = this.state;
    let state = mainStateController.updateFromSimulatorState(simulatorState);
    // The action button is hidden on the Learn screen (matching the GNOME app).
    if (this._activeView === ViewType.LEARN && !this.threeColumns) state = MainButtonState.HIDDEN;
    this._mainButton.setState(state);

    // The run toolbar's buttons follow the same enabled states the GNOME window gives its actions.
    const enabled = mainStateController.getActionEnabledState(
      simulatorState,
      editorController.hasCode,
      mainStateController.getCodeChanged()
    );
    this._actions.get("assemble")!.enabled = enabled.assemble;
    this._actions.get("run-simulator")!.enabled = enabled.run;
    this._actions.get("resume-simulator")!.enabled = enabled.resume;
    this._actions.get("pause-simulator")!.enabled = enabled.pause;
    this._actions.get("reset-simulator")!.enabled = enabled.reset;
    this._actions.get("step-simulator")!.enabled = enabled.step;
    this._actions.get("share")!.enabled = enabled.share;
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
