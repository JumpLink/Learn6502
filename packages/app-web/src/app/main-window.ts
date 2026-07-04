/**
 * MainWindow — the app-web Adwaita SPA shell.
 *
 * Web counterpart of the GNOME `MainWindow` (`app-gnome/src/views/main.window`).
 * It reproduces that window's structure and navigation semantics on
 * `@gjsify/adwaita-web`, driven by the SAME shared `@learn6502/common-ui`
 * controllers/services the GNOME and Android apps use — nothing in common-ui is
 * reimplemented here.
 *
 * Structure (mapped to app-gnome's `main.window.blp`):
 *   AdwToolbarView
 *     [top]    AdwHeaderBar — window title, sidebar toggle, learn-back button,
 *              run controls, primary AdwMenuButton
 *     content  AdwToastOverlay > #layout-host, which holds EITHER
 *                • the mobile single AdwViewStack  (one view at a time), or
 *                • the desktop AdwOverlaySplitView (Learn sidebar | Editor |
 *                  GameConsole-over-Debugger), mirroring the Gtk.Stack
 *                  "single"/"three" layoutHost swap
 *     [bottom]  AdwViewSwitcherBar — mobile tab bar bound to the stack
 *
 * The Adw.Breakpoint that drives app-gnome's layout has no web primitive, so the
 * single ⇄ three swap is a `matchMedia` query mirroring its 800×600 / 1000×600
 * thresholds.
 *
 * Phase 1 shipped the Debugger as the first REAL view (the ADR-0007 spike's
 * `AdwDebuggerView`, wired through the shared `GameConsoleEventBridge`).
 * Phase 2 added Learn (`AdwLearnView`, rendering `@learn6502/learn`'s generated
 * tutorial HTML). Phase 3 adds the Editor (`AdwEditorView`, the CodeMirror
 * `<adw-source-view>` + quick-help sheet). GameConsole remains an
 * `adw-status-page` placeholder that a later phase replaces.
 */

import {
  AdwButton,
  AdwHeaderBar,
  AdwMenuButton,
  AdwOverlaySplitView,
  AdwStatusPage,
  AdwToastOverlay,
  AdwToolbarView,
  AdwViewStack,
  AdwViewSwitcherBar,
  AdwWindow,
  AdwWindowTitle,
} from "@gjsify/adwaita-web";
import {
  DebuggerState,
  GameConsoleEventBridge,
  type MainButtonActionState,
  type MainView,
  ViewType,
  debuggerController,
  editorController,
  gameConsoleController,
  learnController,
  mainStateController,
} from "@learn6502/common-ui";
import { Assembler, Labels, Memory, Simulator, SimulatorState, formatMessage } from "@learn6502/core";

import { AdwDebuggerView } from "../views/adw-debugger.js";
import { AdwEditorView } from "../widgets/editor/index.js";
import { AdwLearnView } from "../widgets/learn/index.js";
import { injectShellStyles } from "./styles.js";

/** Notification key → toast title (the GNOME twin's NOTIFICATION_TITLES, English only). */
const NOTIFICATION_TITLES: Record<string, string> = {
  "assembled-successfully": "Assembled successfully",
  "assemble-failed": "Assemble failed",
  "simulator-failure": "Simulator failure",
  "labels-failure": "Labels failure",
  "program-completed": "Program completed",
};

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

/** Per-view descriptor for building the mobile stack + switcher pages. */
interface ViewSlot {
  type: ViewType;
  name: string;
  title: string;
  icon: string;
  element: HTMLDivElement;
}

export class MainWindow implements MainView {
  /** The root element to mount into the document. */
  public readonly root: AdwWindow;

  // Core simulator objects (what GameConsole owns on every platform).
  private readonly memory = new Memory();
  private readonly labels = new Labels();
  private readonly simulator = new Simulator(this.memory, this.labels);
  private readonly assembler = new Assembler(this.memory, this.labels);

  // Real views; GameConsole remains a placeholder (later phase).
  private readonly debuggerView = new AdwDebuggerView();
  private readonly editorView = new AdwEditorView();
  private readonly learnView = new AdwLearnView();

  // Persistent per-view slot wrappers, re-homed between the two layouts.
  private readonly slots: ViewSlot[];
  private readonly learnSlot = this.makeSlot();
  private readonly editorSlot = this.makeSlot();
  private readonly debuggerSlot = this.makeSlot();
  private readonly gameConsoleSlot = this.makeSlot();

  // Chrome.
  private readonly toastOverlay = new AdwToastOverlay();
  private readonly switcherBar = new AdwViewSwitcherBar();
  private readonly titleWidget = new AdwWindowTitle();
  private readonly runControls = document.createElement("div");
  private readonly sidebarToggle = new AdwButton();
  private readonly learnBackButton = new AdwButton();
  private readonly assembleButton = new AdwButton();
  private readonly runButton = new AdwButton();
  private readonly pauseButton = new AdwButton();
  private readonly stepButton = new AdwButton();
  private readonly resetButton = new AdwButton();

  // Layout hosts.
  private readonly layoutHost = document.createElement("div");
  private readonly mobileLayout = document.createElement("div");
  private readonly desktopLayout = document.createElement("div");
  private readonly splitView = new AdwOverlaySplitView();
  private readonly sidebarColumn = document.createElement("div");
  private readonly centerColumn = document.createElement("div");
  private readonly rightTop = document.createElement("div");
  private readonly rightBottom = document.createElement("div");

  // Adaptive-layout media queries (mirror app-gnome's Adw.Breakpoint thresholds).
  private readonly desktopMq = window.matchMedia("(min-width: 800px) and (min-height: 600px)");
  private readonly wideMq = window.matchMedia("(min-width: 1000px) and (min-height: 600px)");

  // The live mobile stack (recreated on each switch to the single layout).
  private mobileStack: AdwViewStack | null = null;

  // State.
  private currentView: ViewType = ViewType.LEARN;
  private codeChanged = false;
  private bridge: GameConsoleEventBridge | null = null;

  constructor() {
    injectShellStyles();

    this.slots = [
      { type: ViewType.LEARN, name: "learn", title: "Learn", icon: "go-home", element: this.learnSlot },
      { type: ViewType.EDITOR, name: "editor", title: "Code", icon: "document-edit", element: this.editorSlot },
      {
        type: ViewType.DEBUGGER,
        name: "debugger",
        title: "Debug",
        icon: "system-search",
        element: this.debuggerSlot,
      },
      {
        type: ViewType.GAME_CONSOLE,
        name: "gameConsole",
        title: "Play",
        icon: "application-x-executable",
        element: this.gameConsoleSlot,
      },
    ];

    this.buildViews();
    this.root = this.buildChrome();

    this.setupControllers();
    this.setupAdaptiveLayout();
    this.seedDemoProgram();
  }

  /**
   * Attach the shell to the document, then mount the initial layout. The
   * layout MUST be applied after the tree is connected: a freshly created
   * AdwViewStack rebuilds its pages from declared children on connect, which
   * would wipe imperatively-added pages if we mounted while detached.
   */
  public mount(parent: HTMLElement): void {
    parent.appendChild(this.root);
    this.applyLayout();
  }

  // --- MainView interface (mirrors app-gnome's MainWindow) ---

  public get state(): SimulatorState {
    return this.simulator.state;
  }

  public get activeView(): ViewType {
    return this.currentView;
  }

  /** Navigate to a view. In the desktop layout every view is visible, so this
   * is a no-op there — exactly like the GNOME twin. */
  public navigateToView(viewType: ViewType): void {
    this.currentView = viewType;
    if (this.isDesktop()) {
      if (viewType === ViewType.DEBUGGER) this.updateDebugger();
      return;
    }
    const slot = this.slots.find((s) => s.type === viewType);
    if (slot && this.mobileStack) this.mobileStack.visibleChildName = slot.name;
  }

  public assembleGameConsole(): void {
    this.debuggerView.reset();
    this.navigateToView(ViewType.DEBUGGER);
    mainStateController.setCodeChanged(false);
    gameConsoleController.assemble(editorController.code);
  }

  public runGameConsole(): void {
    const target = mainStateController.getNavigationTarget("run");
    if (target && target !== this.activeView) this.navigateToView(target);
    if (debuggerController.stepperEnabled) debuggerController.stepperEnabled = false;
    gameConsoleController.run();
  }

  public pauseGameConsole(): void {
    gameConsoleController.stop();
    this.showToast("Program paused");
  }

  public reset(): void {
    gameConsoleController.reset();
    this.debuggerView.reset();
  }

  public stepGameConsole(): void {
    const target = mainStateController.getNavigationTarget("step");
    if (target && target !== this.activeView) this.navigateToView(target);
    if (!debuggerController.stepperEnabled) debuggerController.stepperEnabled = true;
    gameConsoleController.step();
    this.updateDebugger();
    this.updateRunActions(this.simulator.state);
  }

  public setEditorCode(code: string): void {
    editorController.setCode(code);
    this.navigateToView(ViewType.EDITOR);
    mainStateController.setCodeChanged(false);
  }

  // --- DOM construction ---

  private makeSlot(): HTMLDivElement {
    const div = document.createElement("div");
    div.className = "shell-view-slot";
    return div;
  }

  private buildViews(): void {
    // GameConsole is still a placeholder; Learn, Editor and Debugger are real.
    this.learnView.classList.add("shell-view-slot");
    this.learnSlot.appendChild(this.learnView);

    this.editorView.classList.add("shell-view-slot");
    this.editorSlot.appendChild(this.editorView);

    this.gameConsoleSlot.appendChild(
      this.placeholder(
        "application-x-executable",
        "Game Console",
        "The display + gamepad view lands in a later phase. Assembled programs already run — watch the Debugger."
      )
    );

    this.debuggerView.classList.add("shell-view-slot");
    this.debuggerSlot.appendChild(this.debuggerView);
  }

  private placeholder(icon: string, title: string, description: string): AdwStatusPage {
    const page = new AdwStatusPage();
    page.setAttribute("icon", icon);
    page.setAttribute("title", title);
    page.setAttribute("description", description);
    return page;
  }

  private buildChrome(): AdwWindow {
    const window_ = new AdwWindow();
    window_.id = "application-window";

    const toolbarView = new AdwToolbarView();

    // --- Header bar (slot=top) ---
    const header = new AdwHeaderBar();
    header.setAttribute("slot", "top");

    this.configureIconButton(this.sidebarToggle, "sidebar-show", "Toggle Sidebar");
    this.sidebarToggle.setAttribute("slot", "start");
    this.sidebarToggle.hidden = true;
    this.sidebarToggle.addEventListener("click", () => this.splitView.toggleSidebar());

    this.configureIconButton(this.learnBackButton, "go-previous", "Back");
    this.learnBackButton.setAttribute("slot", "start");
    this.learnBackButton.hidden = true; // no Learn subpages until the Learn phase

    this.runControls.className = "shell-run-controls";
    this.runControls.setAttribute("slot", "start");
    this.configureTextButton(this.assembleButton, "Assemble", () => this.assembleGameConsole(), "suggested");
    this.configureTextButton(this.runButton, "Run", () => this.runGameConsole());
    this.configureTextButton(this.pauseButton, "Pause", () => this.pauseGameConsole());
    this.configureTextButton(this.stepButton, "Step", () => this.stepGameConsole());
    this.configureTextButton(this.resetButton, "Reset", () => this.reset());
    this.runControls.append(this.assembleButton, this.runButton, this.pauseButton, this.stepButton, this.resetButton);

    this.titleWidget.setAttribute("slot", "center");
    this.titleWidget.setAttribute("title", "Learn 6502 Assembly");

    const menuButton = new AdwMenuButton();
    menuButton.setAttribute("slot", "end");
    menuButton.menuTitle = "Main Menu";
    menuButton.menuItems = [
      { id: "help", label: "Help" },
      { id: "shortcuts", label: "Keyboard Shortcuts" },
      { id: "about", label: "About Learn 6502 Assembly" },
    ];
    menuButton.addEventListener("menu-item-activated", (event) => {
      const id = (event as CustomEvent<{ id: string }>).detail.id;
      if (id === "help") {
        // Reveal the Editor's 6502 quick-help sheet (the GNOME twin's help).
        this.navigateToView(ViewType.EDITOR);
        editorController.setHelpVisible(true);
        return;
      }
      this.showToast(`Menu: ${id} (coming soon)`);
    });

    header.append(this.sidebarToggle, this.learnBackButton, this.runControls, this.titleWidget, menuButton);

    // --- Content (unslotted): toast overlay > layout host ---
    this.buildLayoutHost();
    this.toastOverlay.appendChild(this.layoutHost);

    // --- Bottom: view switcher bar ---
    this.switcherBar.setAttribute("slot", "bottom");

    toolbarView.append(header, this.toastOverlay, this.switcherBar);
    window_.appendChild(toolbarView);
    return window_;
  }

  private buildLayoutHost(): void {
    this.layoutHost.id = "layout-host";
    this.mobileLayout.id = "mobile-layout";
    this.desktopLayout.id = "desktop-layout";

    // Desktop split view: Learn sidebar | (Editor | GameConsole-over-Debugger).
    this.splitView.setAttribute("min-sidebar-width", "260");
    this.splitView.setAttribute("max-sidebar-width", "420");
    this.splitView.setAttribute("sidebar-width-fraction", "0.25");

    this.sidebarColumn.className = "shell-sidebar-column";
    this.sidebarColumn.setAttribute("slot", "sidebar");

    const centerRight = document.createElement("div");
    centerRight.className = "shell-center-right";
    centerRight.setAttribute("slot", "content");

    this.centerColumn.className = "shell-center-column";
    this.rightTop.className = "shell-right-top";
    this.rightBottom.className = "shell-right-bottom";
    const rightColumn = document.createElement("div");
    rightColumn.className = "shell-right-column";
    rightColumn.append(this.rightTop, this.rightBottom);
    centerRight.append(this.centerColumn, rightColumn);

    this.splitView.append(this.sidebarColumn, centerRight);
    this.desktopLayout.appendChild(this.splitView);

    this.layoutHost.append(this.mobileLayout, this.desktopLayout);
  }

  private configureIconButton(button: AdwButton, icon: string, tooltip: string): void {
    button.setAttribute("icon", icon);
    button.setAttribute("tooltip", tooltip);
    button.setAttribute("flat", "");
  }

  private configureTextButton(button: AdwButton, label: string, onClick: () => void, variant?: "suggested"): void {
    button.setAttribute("label", label);
    if (variant) button.setAttribute(variant, "");
    button.addEventListener("click", onClick);
  }

  // --- Controller wiring (the shared common-ui pipeline) ---

  private setupControllers(): void {
    // GameConsole controller in assembler-only mode (no display/gamepad yet),
    // exactly like the ADR-0007 spike.
    gameConsoleController.initPartial({
      memory: this.memory,
      simulator: this.simulator,
      assembler: this.assembler,
      labels: this.labels,
    });

    // The real Debugger view over the shared debuggerController.
    this.debuggerView.initialize(this.assembler, this.simulator);
    this.debuggerView.state = DebuggerState.ACTIVE;

    // GameConsole signals → debugger/toast updates (same seam as GNOME/Android).
    this.bridge = new GameConsoleEventBridge({
      formatAndLog: (message, params) => this.debuggerView.log(formatMessage(message, params ?? [])),
      updateDebugger: () => this.updateDebugger(),
      updateAssemblerViews: (asm) => {
        this.debuggerView.updateHexdump(asm);
        this.debuggerView.updateDisassembled(asm);
      },
      updateUiState: () => this.updateRunActions(this.simulator.state),
      showNotification: (key) => this.showToast(NOTIFICATION_TITLES[key] ?? key),
      updateDebugInfo: () => {
        if (this.simulator.stepperEnabled) this.updateDebugger();
      },
    });
    this.bridge.connect();

    // Debugger controller → host-level actions the view leaves to the shell.
    debuggerController.on("copyToEditor", (code: string) => {
      this.setEditorCode(code);
      this.showToast("Code copied to editor");
    });
    debuggerController.on("copyToClipboard", () => this.showToast("Copied to clipboard"));
    debuggerController.on("stepperToggled", () => this.updateRunActions(this.simulator.state));

    // Learn → Editor seam (ready for the Learn phase; harmless until then).
    learnController.on("copy", ({ code }: { code: string }) => {
      this.setEditorCode(code);
      this.showToast("Code copied to editor");
    });

    // A user edit in the Editor marks the program dirty (the MainEventBridge
    // seam the GNOME/Android main views use — the web shell wires it directly).
    editorController.events.on("changed", () => mainStateController.setCodeChanged(true));

    // Main UI state → run-control enablement.
    mainStateController.events.on("state-changed", () => this.updateRunActions(this.simulator.state));
    mainStateController.events.on("state-changed:code-changed", (changed: boolean) => {
      this.codeChanged = changed;
      this.updateRunActions(this.simulator.state);
    });
    mainStateController.init();

    this.updateRunActions(this.simulator.state);
  }

  private updateDebugger(): void {
    if (this.isDesktop() || this.currentView === ViewType.DEBUGGER) {
      this.debuggerView.update(this.memory, this.simulator);
    }
  }

  private updateRunActions(state: SimulatorState): void {
    const enabled: MainButtonActionState = mainStateController.getActionEnabledState(
      state,
      editorController.hasCode,
      this.codeChanged
    );
    this.setButtonEnabled(this.assembleButton, enabled.assemble);
    this.setButtonEnabled(this.runButton, enabled.run || enabled.resume);
    this.setButtonEnabled(this.pauseButton, enabled.pause);
    this.setButtonEnabled(this.stepButton, enabled.step);
    this.setButtonEnabled(this.resetButton, enabled.reset);
  }

  private setButtonEnabled(button: AdwButton, enabled: boolean): void {
    if (enabled) button.removeAttribute("disabled");
    else button.setAttribute("disabled", "");
  }

  private showToast(title: string): void {
    this.toastOverlay.addToast(title, 2000);
  }

  private seedDemoProgram(): void {
    editorController.setCode(DEMO_PROGRAM);
    mainStateController.setCodeChanged(false);
    this.updateRunActions(this.simulator.state);
  }

  // --- Adaptive layout (single ⇄ three, matchMedia mirror of Adw.Breakpoint) ---

  private setupAdaptiveLayout(): void {
    // A change to the visible view from the switcher bubbles as
    // notify::visible-child; keep MainView state + the debugger in sync.
    this.layoutHost.addEventListener("notify::visible-child", (event) => {
      const name = (event as CustomEvent<{ name: string }>).detail.name;
      const slot = this.slots.find((s) => s.name === name);
      if (!slot) return;
      const previous = this.currentView;
      this.currentView = slot.type;
      mainStateController.setViewType(slot.type);
      // Auto-pause when switching away from a running program (GNOME twin).
      if (
        (previous === ViewType.GAME_CONSOLE || previous === ViewType.DEBUGGER) &&
        this.simulator.state === SimulatorState.RUNNING
      ) {
        this.pauseGameConsole();
      }
      // Preserve the tutorial's reading position across mobile tab switches
      // (the GNOME twin's saveScrollPosition/restoreScrollPosition seam).
      if (previous === ViewType.LEARN && slot.type !== ViewType.LEARN) this.learnView.saveScrollPosition();
      if (previous === ViewType.EDITOR && slot.type !== ViewType.EDITOR) this.editorView.saveState();
      if (slot.type === ViewType.LEARN) this.learnView.restoreScrollPosition();
      if (slot.type === ViewType.DEBUGGER) this.updateDebugger();
    });

    // Initial layout is applied by mount() once the tree is connected.
    this.desktopMq.addEventListener("change", () => this.applyLayout());
    this.wideMq.addEventListener("change", () => this.applyLayout());
  }

  private applyLayout(): void {
    if (this.isDesktop()) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
  }

  private isDesktop(): boolean {
    return this.desktopMq.matches;
  }

  /** Mount the mobile single layout: one fresh ViewStack + revealed switcher. */
  private mountSingleLayout(): void {
    const stack = new AdwViewStack();
    // Connect first (empty), THEN add pages — AdwViewStack.connectedCallback
    // rebuilds from declared children and would otherwise wipe pre-adds.
    this.mobileLayout.replaceChildren(stack);
    for (const slot of this.slots) {
      this.resetSlot(slot.element);
      stack.add(slot.element, slot.name, slot.title, slot.icon);
    }
    stack.visibleChildName = this.currentView;
    this.mobileStack = stack;

    this.switcherBar.setStack(stack);
    this.switcherBar.revealed = true;
    this.sidebarToggle.hidden = true;
    // Run controls are desktop-only (the GNOME twin shows a FAB on mobile;
    // that MainButton lands in a later phase). Keep the title for context.
    this.runControls.hidden = true;

    this.mobileLayout.hidden = false;
    this.desktopLayout.hidden = true;

    if (this.currentView === ViewType.DEBUGGER) this.updateDebugger();
  }

  /** Mount the desktop three-column layout: Learn | Editor | console-over-debugger. */
  private mountThreeColumnLayout(): void {
    this.homeSlot(this.learnSlot, this.sidebarColumn);
    this.homeSlot(this.editorSlot, this.centerColumn);
    this.homeSlot(this.gameConsoleSlot, this.rightTop);
    this.homeSlot(this.debuggerSlot, this.rightBottom);

    this.switcherBar.setStack(null);
    this.switcherBar.revealed = false;
    this.mobileStack = null;
    this.mobileLayout.replaceChildren();

    this.sidebarToggle.hidden = false;
    this.runControls.hidden = false;
    this.applySidebarMode();

    this.desktopLayout.hidden = false;
    this.mobileLayout.hidden = true;

    this.updateDebugger();
  }

  /** Wide desktop docks the sidebar; medium desktop overlays it (collapsed). */
  private applySidebarMode(): void {
    if (this.wideMq.matches) {
      this.splitView.collapsed = false;
      this.splitView.showSidebar = true;
    } else {
      this.splitView.collapsed = true;
      this.splitView.showSidebar = false;
    }
  }

  /** Move a view slot into a desktop column, clearing any stack-mode leftovers. */
  private homeSlot(slot: HTMLDivElement, parent: HTMLElement): void {
    this.resetSlot(slot);
    parent.appendChild(slot);
  }

  private resetSlot(slot: HTMLDivElement): void {
    slot.hidden = false;
    slot.classList.remove("adw-view-stack-child", "active-view");
  }
}
