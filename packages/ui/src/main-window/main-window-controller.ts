import type Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";

import { SimulatorState, formatMessage, num2hex } from "@learn6502/core";
import {
  type MainButtonState,
  type MainView,
  ViewType,
  GameConsoleEventBridge,
  createSimulatorStack,
  debuggerController,
  editorController,
  gameConsoleController,
  learnController,
  mainStateController,
} from "@learn6502/common-ui";

import { _ } from "../translate.ts";
import type { Debugger } from "../debugger/debugger.ts";
import type { Editor } from "../editor/editor.ts";
import type { GameConsole } from "../game-console/game-console.ts";
import type { Learn } from "../learn/learn.ts";
import type { MainButton } from "../main-button.ts";
import type { MainWindowServices } from "./services.ts";
import { WindowBehaviour } from "./window-behaviour.ts";
import { persistWindowSize } from "./window-size.ts";

/** The widgets the window's template provides. */
export interface MainWindowParts {
  editor: Editor;
  gameConsole: GameConsole;
  learn: Learn;
  debugger: Debugger;
  mainButton: MainButton;
  stack: Adw.ViewStack;
  switcherBar: Adw.ViewSwitcherBar;
  layoutHost: Gtk.Stack;
  leftSidebar: Adw.OverlaySplitView;
  leftColumn: Gtk.Box;
  centerColumn: Gtk.Box;
  rightTopBox: Gtk.Box;
  rightBottomBox: Gtk.Box;
  unsavedChangesDialog: Adw.AlertDialog;
  titleLabel: Gtk.Label;
  unsavedChangesIndicator: Gtk.Button;
  learnBackButton: Gtk.Button;
}

/** Notification key to translated toast title. */
const NOTIFICATION_TITLES: Record<string, () => string> = {
  // TRANSLATORS: Toast message title after successful assembly
  "assembled-successfully": () => _("Assembled successfully"),
  // TRANSLATORS: Toast message title after assembly failure
  "assemble-failed": () => _("Assemble failed"),
  // TRANSLATORS: Toast message title when simulator reports a failure
  "simulator-failure": () => _("Simulator failure"),
  // TRANSLATORS: Toast message title when labels processing fails
  "labels-failure": () => _("Labels failure"),
  // TRANSLATORS: Toast message title when the program has finished execution
  "program-completed": () => _("Program completed"),
};

/**
 * The main window's logic, written once: navigation, the run/step/assemble flow, file handling and the
 * window's own state. The platform builds the widgets from `main.window.blp` and injects its services.
 */
export class MainWindowController implements MainView {
  private readonly parts: MainWindowParts;
  private readonly behaviour: WindowBehaviour;
  private readonly viewWidgetMap = new Map<ViewType, Gtk.Widget>();
  private gameConsoleBridge: GameConsoleEventBridge | null = null;

  private previousVisibleChild: Gtk.Widget | null = null;
  private pendingDialogAction: "open" | "close" | null = null;
  private codeToAssembleChanged = false;
  private focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly assembleAction = new Gio.SimpleAction({ name: "assemble" });
  private readonly runSimulatorAction = new Gio.SimpleAction({ name: "run-simulator" });
  private readonly resumeSimulatorAction = new Gio.SimpleAction({ name: "resume-simulator" });
  private readonly pauseSimulatorAction = new Gio.SimpleAction({ name: "pause-simulator" });
  private readonly resetSimulatorAction = new Gio.SimpleAction({ name: "reset-simulator" });
  private readonly stepSimulatorAction = new Gio.SimpleAction({ name: "step-simulator" });
  private readonly shareAction = new Gio.SimpleAction({ name: "share" });
  private readonly openFileAction = new Gio.SimpleAction({ name: "open-file" });
  private readonly saveFileAction = new Gio.SimpleAction({ name: "save-file" });
  private readonly saveAsFileAction = new Gio.SimpleAction({ name: "save-as-file" });
  private readonly showHelpAction = new Gio.SimpleAction({ name: "show-help" });

  constructor(
    private readonly window: Adw.ApplicationWindow,
    parts: MainWindowParts,
    private readonly services: MainWindowServices
  ) {
    this.parts = parts;
    this.behaviour = new WindowBehaviour({
      window,
      isRunning: () => this.state === SimulatorState.RUNNING,
      pause: () => this.pauseGameConsole(),
      onCloseRequest: () => this.onCloseRequest(),
      isDesktopLayout: () => this.isDesktopMode(),
      isInsideConsole: (widget) => this.widgetIsDescendantOf(widget, this.parts.gameConsole),
    });
  }

  /** Wire the window up; call once the template children exist. */
  init(): void {
    const { gameConsole, debugger: debuggerView, layoutHost, stack } = this.parts;

    // One simulator stack for the console that runs it and the debugger that shows it.
    const simulatorStack = createSimulatorStack();
    gameConsole.setSimulatorStack(simulatorStack);
    debuggerView.setSimulatorStack(simulatorStack);

    this.mountLayout();
    layoutHost.connect("notify::visible-child-name", () => {
      this.mountLayout();
      this.updateLearnBackButtonVisibility();
    });

    this.viewWidgetMap.set(ViewType.LEARN, this.parts.learn);
    this.viewWidgetMap.set(ViewType.EDITOR, this.parts.editor);
    this.viewWidgetMap.set(ViewType.DEBUGGER, debuggerView);
    this.viewWidgetMap.set(ViewType.GAME_CONSOLE, gameConsole);

    stack.connect("notify::visible-child", () => this.onStackVisibleChildChanged());
    this.parts.learn.events.on("subpage-changed", () => this.updateLearnBackButtonVisibility());
    this.parts.learn.events.on("share", () => this.shareAction.activate(null));

    this.setupActions();
    this.setupGameConsoleBridge();
    this.setupLearnListeners();
    this.setupEditorListeners();
    this.setupDebuggerListeners();
    this.setupMainStateListeners();

    this.updateRunActions(this.state);
    mainStateController.init();
    this.previousVisibleChild = stack.get_visible_child();

    this.behaviour.attach();
    persistWindowSize(this.window, this.services.settings);
  }

  // --- MainView ---

  public get state(): SimulatorState {
    return this.parts.gameConsole.simulator.state;
  }

  public get activeView(): ViewType {
    const visibleChild = this.parts.stack.get_visible_child();
    for (const [viewType, widget] of this.viewWidgetMap.entries()) {
      if (widget === visibleChild) return viewType;
    }
    return ViewType.LEARN;
  }

  public navigateToView(viewType: ViewType): void {
    // In desktop mode, all relevant views are visible. Skip switching the stack.
    if (this.isDesktopMode()) return;
    const widget = this.viewWidgetMap.get(viewType);
    if (widget) {
      this.parts.stack.set_visible_child(widget);
    } else {
      console.error(`navigateToView: Widget not found for view ${viewType}`);
    }
  }

  public runGameConsole(): void {
    const targetView = mainStateController.getNavigationTarget("run");
    if (targetView && targetView !== this.activeView) this.navigateToView(targetView);
    if (debuggerController.stepperEnabled) debuggerController.stepperEnabled = false;

    this.parts.gameConsole.run();
    // The console takes the focus so keyboard/gamepad input works at once; focusing again a moment
    // later wins over the transient focus of the toolbar button that started the program.
    this.behaviour.noteRun();
    this.parts.gameConsole.focus();
    if (this.focusTimeoutId !== null) clearTimeout(this.focusTimeoutId);
    this.focusTimeoutId = setTimeout(() => {
      this.parts.gameConsole.focus();
      this.focusTimeoutId = null;
    }, 150);
  }

  public pauseGameConsole(): void {
    this.parts.gameConsole.stop();
    this.showToast(
      // TRANSLATORS: Toast message title shown when pausing the game console
      _("Program paused")
    );
  }

  public reset(): void {
    this.parts.gameConsole.reset();
    this.parts.debugger.reset();
  }

  public assembleGameConsole(): void {
    this.parts.debugger.reset();
    this.navigateToView(ViewType.DEBUGGER);

    // Reset the code changed flag BEFORE assembling
    mainStateController.setCodeChanged(false);
    this.parts.gameConsole.assemble(editorController.code);
  }

  public stepGameConsole(): void {
    const targetView = mainStateController.getNavigationTarget("step");
    if (targetView && targetView !== this.activeView) this.navigateToView(targetView);

    // Enabling the stepper through the controller keeps the UI in sync
    if (!debuggerController.stepperEnabled) debuggerController.stepperEnabled = true;

    this.parts.gameConsole.simulator.debugExecStep();
    this.updateDebugger();
    this.updateRunActions(this.state);
  }

  public setEditorCode(code: string): void {
    editorController.setCode(code);
    this.navigateToView(ViewType.EDITOR);

    mainStateController.setCodeChanged(false);
    this.unsavedChanges = false;
  }

  // --- State ---

  private isDesktopMode(): boolean {
    return this.parts.layoutHost.get_visible_child_name() === "three";
  }

  private set unsavedChanges(unsavedChanges: boolean) {
    this.services.files.setUnsavedChanges(unsavedChanges);
  }

  private get unsavedChanges(): boolean {
    return this.parts.unsavedChangesIndicator.visible;
  }

  private widgetIsDescendantOf(widget: Gtk.Widget | null, ancestor: Gtk.Widget): boolean {
    let current: Gtk.Widget | null = widget;
    while (current) {
      if (current === ancestor) return true;
      current = current.get_parent();
    }
    return false;
  }

  private showToast(title: string, timeout = 2): void {
    this.services.notifier.show({ title, timeout });
  }

  // --- Listeners ---

  private setupLearnListeners(): void {
    learnController.on("copy", ({ code }: { code: string }) => {
      this.setEditorCode(code);
      this.closeSidebarIfOverlay();
      // TRANSLATORS: Toast message title after copying code snippet into the editor
      this.showToast(_("Code copied to editor"));
    });
  }

  private setupEditorListeners(): void {
    this.parts.editor.events.on("changed", () => {
      this.unsavedChanges = true;
      mainStateController.setCodeChanged(true);
    });
  }

  private setupDebuggerListeners(): void {
    debuggerController.on("copyToClipboard", (code: string) => {
      if (this.services.clipboard.copy(code)) {
        // TRANSLATORS: Toast message title after copying to clipboard
        this.showToast(_("Copied to clipboard"));
      } else {
        // TRANSLATORS: Toast message title when clipboard copy fails
        this.showToast(_("Failed to copy to clipboard"));
      }
    });
    debuggerController.on("copyToEditor", (code: string) => {
      this.setEditorCode(code);
      this.closeSidebarIfOverlay();
    });
    debuggerController.on("stepperToggled", () => this.updateRunActions(this.state));
  }

  private setupMainStateListeners(): void {
    mainStateController.events.on("state-changed", () => this.updateRunActions(this.state));
    mainStateController.events.on("state-changed:code-changed", (changed) => {
      this.codeToAssembleChanged = changed;
      this.updateRunActions(this.state);
    });

    // Keep the shared gameplay keys: the platform registers its keycodes, the log is shared
    gameConsoleController.on("keyPressed", (event) => {
      const visibleChild = this.parts.stack.get_visible_child();
      if (visibleChild === this.parts.gameConsole || visibleChild === this.parts.debugger) {
        this.parts.debugger.log(
          // TRANSLATORS: Debugger log message when gamepad key is pressed
          _("Gamepad key pressed:") + " $" + num2hex(event.keyCode).toUpperCase()
        );
      }
    });
  }

  private setupGameConsoleBridge(): void {
    const { gameConsole, debugger: debuggerView } = this.parts;
    this.gameConsoleBridge = new GameConsoleEventBridge({
      formatAndLog: (message, params) => debuggerView.log(formatMessage(_(message), params || [])),
      updateDebugger: () => this.updateDebugger(),
      updateAssemblerViews: () => {
        debuggerView.updateHexdump(gameConsole.assembler);
        debuggerView.updateDisassembled(gameConsole.assembler);
      },
      updateUiState: () => this.updateRunActions(this.state),
      showNotification: (key) => {
        const title = NOTIFICATION_TITLES[key];
        this.showToast(title ? title() : key);
      },
    });
    this.gameConsoleBridge.connect();
  }

  // --- Actions ---

  private setupActions(): void {
    const bindings: [Gio.SimpleAction, () => unknown][] = [
      [this.assembleAction, () => this.assembleGameConsole()],
      [this.runSimulatorAction, () => this.runGameConsole()],
      [this.resumeSimulatorAction, () => this.runGameConsole()],
      [this.pauseSimulatorAction, () => this.pauseGameConsole()],
      [this.resetSimulatorAction, () => this.reset()],
      [this.stepSimulatorAction, () => this.stepGameConsole()],
      [this.shareAction, () => this.services.showShareDialog(editorController.code, this.parts.gameConsole.memory)],
      [this.openFileAction, () => this.openFile()],
      [this.saveFileAction, () => this.saveFile()],
      [this.saveAsFileAction, () => this.saveAsFile()],
      [this.showHelpAction, () => this.services.showHelp()],
    ];
    for (const [action, handler] of bindings) {
      action.connect("activate", () => handler());
      this.window.add_action(action);
    }

    const app = this.window.get_application();
    if (app) {
      app.set_accels_for_action(`win.${this.openFileAction.get_name()}`, ["<Control>o"]);
      app.set_accels_for_action(`win.${this.saveFileAction.get_name()}`, ["<Control>s"]);
      app.set_accels_for_action(`win.${this.saveAsFileAction.get_name()}`, ["<Control><Shift>s"]);
    }

    this.parts.unsavedChangesDialog.connect("response", (_dialog: Adw.AlertDialog, response: string) =>
      this.onUnsavedChangesResponse(response)
    );
  }

  private updateRunActions(state: SimulatorState): MainButtonState {
    const enabledState = mainStateController.getActionEnabledState(
      state,
      editorController.hasCode,
      this.codeToAssembleChanged
    );

    this.assembleAction.set_enabled(enabledState.assemble);
    this.runSimulatorAction.set_enabled(enabledState.run);
    this.resumeSimulatorAction.set_enabled(enabledState.resume);
    this.pauseSimulatorAction.set_enabled(enabledState.pause);
    this.resetSimulatorAction.set_enabled(enabledState.reset);
    this.stepSimulatorAction.set_enabled(enabledState.step);
    this.shareAction.set_enabled(enabledState.share);

    return this.parts.mainButton.updateFromSimulatorState(state);
  }

  // --- Stack, layout ---

  private onStackVisibleChildChanged(): void {
    const { stack, learn, gameConsole, debugger: debuggerView } = this.parts;
    const currentChild = stack.get_visible_child();

    this.updateLearnBackButtonVisibility();

    if (this.previousVisibleChild === learn && currentChild !== learn) {
      learn.saveScrollPosition();
    }

    if (currentChild === learn && this.previousVisibleChild !== learn) {
      // The Learn widget has to be mapped before its scroll position can be restored
      if (learn.get_mapped()) {
        learn.restoreScrollPosition();
      } else {
        const handler = learn.connect("map", () => {
          learn.restoreScrollPosition();
          learn.disconnect(handler);
        });
      }
    }

    // Switching away from the console or debugger pauses a running program
    if (
      (this.previousVisibleChild === gameConsole || this.previousVisibleChild === debuggerView) &&
      this.state === SimulatorState.RUNNING
    ) {
      this.pauseGameConsole();
    }

    this.previousVisibleChild = currentChild;
    mainStateController.setViewType(this.activeView);

    if (currentChild === debuggerView) this.updateDebugger();
  }

  private updateDebugger(): void {
    // The debugger updates while visible: the active page on mobile, always on desktop
    if (this.isDesktopMode() || this.parts.stack.get_visible_child() === this.parts.debugger) {
      this.parts.debugger.update(this.parts.gameConsole.memory, this.parts.gameConsole.simulator);
    }
  }

  private updateLearnBackButtonVisibility(): void {
    const isLearnVisible = this.parts.stack.get_visible_child() === this.parts.learn;
    const hasSubpage = this.parts.learn.hasVisibleSubpage;
    // On mobile the button belongs to the Learn tab only
    this.parts.learnBackButton.visible = hasSubpage && (this.isDesktopMode() || isLearnVisible);
  }

  private mountLayout(): void {
    if (this.isDesktopMode()) {
      this.mountThreeColumnLayout();
    } else {
      this.mountSingleLayout();
    }
  }

  /** Mobile: all views as pages of one stack. */
  private mountSingleLayout(): void {
    const { stack, learn, editor, debugger: debuggerView, gameConsole } = this.parts;
    for (const view of [learn, editor, debuggerView, gameConsole]) this.detachFromParent(view);

    const pages = stack.get_pages();
    const toRemove: Gtk.Widget[] = [];
    for (let i = 0; i < pages.get_n_items(); i++) {
      const child = (pages.get_item(i) as Gtk.StackPage).get_child();
      if (child) toRemove.push(child);
    }
    for (const child of toRemove) stack.remove(child);

    // TRANSLATORS: ViewSwitcher/tab title for the Learn/Tutorial view
    stack.add_titled_with_icon(learn, "learn", _("Learn"), "school-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Editor view
    stack.add_titled_with_icon(editor, "editor", _("Code"), "code-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Debugger view
    stack.add_titled_with_icon(debuggerView, "debugger", _("Debug"), "bug-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Game Console view
    stack.add_titled_with_icon(gameConsole, "gameConsole", _("Play"), "nintendo-controller-symbolic");

    this.parts.switcherBar.set_stack(stack);
    // The debugger scrolls on its own when it fills a whole page
    debuggerView.scrollable = true;
  }

  /** Desktop: Learn | Editor | Game Console over Debugger. */
  private mountThreeColumnLayout(): void {
    const { learn, editor, gameConsole, debugger: debuggerView } = this.parts;
    for (const box of [
      this.parts.leftColumn,
      this.parts.centerColumn,
      this.parts.rightTopBox,
      this.parts.rightBottomBox,
    ]) {
      this.clearBoxChildren(box);
    }

    const placements: [Gtk.Widget, Gtk.Box][] = [
      [learn, this.parts.leftColumn],
      [editor, this.parts.centerColumn],
      [gameConsole, this.parts.rightTopBox],
      [debuggerView, this.parts.rightBottomBox],
    ];
    for (const [view, box] of placements) {
      this.detachFromParent(view);
      box.append(view);
    }

    // The right column scrolls as a whole
    debuggerView.scrollable = false;
    this.parts.switcherBar.set_stack(null);
  }

  private clearBoxChildren(box: Gtk.Box): void {
    let child = box.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      box.remove(child);
      child = next;
    }
  }

  private detachFromParent(widget: Gtk.Widget): void {
    const parent = widget.get_parent() as (Gtk.Widget & { remove?: (child: Gtk.Widget) => void }) | null;
    parent?.remove?.(widget);
  }

  /** Close the sidebar when it overlays the content, so copied code is visible at once. */
  private closeSidebarIfOverlay(): void {
    if (this.isDesktopMode() && this.parts.leftSidebar.collapsed) {
      this.parts.leftSidebar.show_sidebar = false;
    }
  }

  // --- Files, closing ---

  private async openFile(): Promise<void> {
    if (this.unsavedChanges) {
      this.showUnsavedChangesDialog("open");
      return;
    }

    const result = await this.services.files.openFile();
    if (result) {
      this.setEditorCode(result.content);
      this.parts.titleLabel.label = result.filename;
      // TRANSLATORS: Toast message title after opening a file, includes filename
      this.showToast(formatMessage(_("Opened %s"), [result.filename]));
    }
  }

  private async saveFile(): Promise<boolean> {
    if (this.services.files.hasCurrentFile()) {
      return await this.services.files.saveFile(editorController.code);
    }
    return await this.saveAsFile();
  }

  private async saveAsFile(): Promise<boolean> {
    const { files } = this.services;
    const success = await files.saveFileAs(
      editorController.code,
      files.hasCurrentFile() ? files.getCurrentFileName() : "untitled.asm"
    );
    if (success) {
      this.parts.titleLabel.label = files.getCurrentFileName();
      // TRANSLATORS: Toast message title after saving file successfully, includes filename
      this.showToast(formatMessage(_("Saved as %s"), [files.getCurrentFileName()]));
    }
    return success;
  }

  private showUnsavedChangesDialog(action: "open" | "close"): void {
    this.pendingDialogAction = action;
    this.parts.unsavedChangesDialog.present(this.window);
  }

  private onUnsavedChangesResponse(response: string): void {
    const action = this.pendingDialogAction;
    this.pendingDialogAction = null;

    const proceed = () => {
      if (action === "open") this.openFile();
      else if (action === "close") this.window.close();
    };

    if (response === "save") {
      this.saveFile().then((success) => {
        if (success) proceed();
      });
    } else if (response === "discard") {
      this.unsavedChanges = false;
      proceed();
    }
  }

  private onCloseRequest(): boolean {
    if (this.unsavedChanges) {
      this.showUnsavedChangesDialog("close");
      return true; // Block the close; the dialog's response decides
    }

    this.parts.gameConsole.close();
    this.parts.debugger.close();
    return false;
  }
}
