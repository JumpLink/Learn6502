import { SimulatorState, formatMessage, num2hex } from "@learn6502/core";
import {
  type MainButtonState,
  type MainView,
  type SimulatorStack,
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
import type { MainWindowShell, ShellAction } from "./shell.ts";
import { WindowBehaviour } from "./window-behaviour.ts";
import { persistWindowSize } from "./window-size.ts";

/** The screens the window shows; the platform builds them and the shell places them. */
export interface MainWindowParts {
  editor: Editor;
  gameConsole: GameConsole;
  learn: Learn;
  debugger: Debugger;
  /** Only its state follow-up is used, so a platform with a header toolbar instead of a floating button can stand in. */
  mainButton: Pick<MainButton, "updateFromSimulatorState">;
  /** A platform that rebuilds its widgets around one process-wide simulator passes it; otherwise a fresh one is made. */
  simulatorStack?: SimulatorStack;
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
 * window's own state. The platform builds the screens and a `MainWindowShell` around them, and injects
 * its services.
 */
export class MainWindowController implements MainView {
  private readonly behaviour: WindowBehaviour;
  private gameConsoleBridge: GameConsoleEventBridge | null = null;

  private askingAboutUnsavedChanges = false;
  private codeToAssembleChanged = false;
  private focusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly actions = new Map<string, ShellAction>();
  // The controllers outlive the window, so every subscription made on them is undone in `disconnect()`
  private readonly unsubscribers: (() => void)[] = [];

  constructor(
    private readonly shell: MainWindowShell,
    private readonly parts: MainWindowParts,
    private readonly services: MainWindowServices
  ) {
    this.behaviour = new WindowBehaviour({
      window: shell.window,
      isRunning: () => this.state === SimulatorState.RUNNING,
      pause: () => this.pauseGameConsole(),
      onCloseRequest: () => this.onCloseRequest(),
      isDesktopLayout: () => this.shell.isDesktopLayout(),
      isInsideConsole: (widget) => this.shell.isInsideConsole(widget),
    });
  }

  /** Wire the window up; call once the shell's widgets exist. */
  init(): void {
    const { gameConsole, debugger: debuggerView } = this.parts;

    // One simulator stack for the console that runs it and the debugger that shows it.
    const simulatorStack = this.parts.simulatorStack ?? createSimulatorStack();
    gameConsole.setSimulatorStack(simulatorStack);
    debuggerView.setSimulatorStack(simulatorStack);

    this.shell.onLayoutChanged(() => this.onLayoutChanged());
    this.shell.onActiveViewChanged((view, previous) => this.onActiveViewChanged(view, previous));
    this.parts.learn.events.on("subpage-changed", () => this.updateLearnBackButtonVisibility());
    this.parts.learn.events.on("share", () => this.submitExample());

    this.setupActions();
    this.setupGameConsoleBridge();
    this.setupLearnListeners();
    this.setupEditorListeners();
    this.setupDebuggerListeners();
    this.setupMainStateListeners();

    this.shell.mountLayout();
    this.onLayoutChanged();
    mainStateController.init();
    this.updateRunActions(this.state);

    this.behaviour.attach();
    persistWindowSize(this.shell.window, this.services.settings);
  }

  // --- MainView ---

  public get state(): SimulatorState {
    return this.parts.gameConsole.simulator.state;
  }

  public get activeView(): ViewType {
    return this.shell.activeView();
  }

  public navigateToView(viewType: ViewType): void {
    // In desktop mode, all relevant views are visible. Skip switching the stack.
    if (this.shell.isDesktopLayout()) return;
    this.shell.showView(viewType);
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

  private set unsavedChanges(unsavedChanges: boolean) {
    this.services.files.setUnsavedChanges(unsavedChanges);
  }

  private get unsavedChanges(): boolean {
    return this.services.files.hasUnsavedChanges();
  }

  private showToast(title: string, timeout = 2): void {
    this.services.notifier.show({ title, timeout });
  }

  private submitExample(): void {
    this.services.submitExample(editorController.code, this.parts.gameConsole.memory);
  }

  public showShareDialog(): void {
    this.services.showShareDialog(editorController.code, this.parts.gameConsole.memory);
  }

  // --- Listeners ---

  private setupLearnListeners(): void {
    const onCopy = ({ code }: { code: string }) => {
      this.setEditorCode(code);
      this.shell.closeSidebarIfOverlay();
      // TRANSLATORS: Toast message title after copying code snippet into the editor
      this.showToast(_("Code copied to editor"));
    };
    learnController.on("copy", onCopy);
    this.unsubscribers.push(() => learnController.off("copy", onCopy));
  }

  private setupEditorListeners(): void {
    this.parts.editor.events.on("changed", () => {
      this.unsavedChanges = true;
      mainStateController.setCodeChanged(true);
    });
  }

  private setupDebuggerListeners(): void {
    const onCopyToClipboard = (code: string) => {
      if (this.services.clipboard.copy(code)) {
        // TRANSLATORS: Toast message title after copying to clipboard
        this.showToast(_("Copied to clipboard"));
      } else {
        // TRANSLATORS: Toast message title when clipboard copy fails
        this.showToast(_("Failed to copy to clipboard"));
      }
    };
    const onCopyToEditor = (code: string) => {
      this.setEditorCode(code);
      this.shell.closeSidebarIfOverlay();
    };
    const onStepperToggled = () => this.updateRunActions(this.state);
    debuggerController.on("copyToClipboard", onCopyToClipboard);
    debuggerController.on("copyToEditor", onCopyToEditor);
    debuggerController.on("stepperToggled", onStepperToggled);
    this.unsubscribers.push(
      () => debuggerController.off("copyToClipboard", onCopyToClipboard),
      () => debuggerController.off("copyToEditor", onCopyToEditor),
      () => debuggerController.off("stepperToggled", onStepperToggled)
    );
  }

  private setupMainStateListeners(): void {
    const onStateChanged = () => this.updateRunActions(this.state);
    const onCodeChanged = (changed: boolean) => {
      this.codeToAssembleChanged = changed;
      this.updateRunActions(this.state);
    };
    mainStateController.events.on("state-changed", onStateChanged);
    mainStateController.events.on("state-changed:code-changed", onCodeChanged);
    this.unsubscribers.push(
      () => mainStateController.events.off("state-changed", onStateChanged),
      () => mainStateController.events.off("state-changed:code-changed", onCodeChanged)
    );

    // Keep the shared gameplay keys: the platform registers its keycodes, the log is shared
    const onKeyPressed = (event: { keyCode: number }) => {
      const view = this.activeView;
      if (view === ViewType.GAME_CONSOLE || view === ViewType.DEBUGGER) {
        this.parts.debugger.log(
          // TRANSLATORS: Debugger log message when gamepad key is pressed
          _("Gamepad key pressed:") + " $" + num2hex(event.keyCode).toUpperCase()
        );
      }
    };
    gameConsoleController.on("keyPressed", onKeyPressed);
    this.unsubscribers.push(() => gameConsoleController.off("keyPressed", onKeyPressed));
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

  /** Stop listening to the controllers, which outlive the window. */
  public disconnect(): void {
    this.gameConsoleBridge?.disconnect();
    this.gameConsoleBridge = null;
    for (const unsubscribe of this.unsubscribers.splice(0)) unsubscribe();
  }

  // --- Actions ---

  private setupActions(): void {
    const bindings: [string, () => unknown, string[]?][] = [
      ["assemble", () => this.assembleGameConsole()],
      ["run-simulator", () => this.runGameConsole()],
      ["resume-simulator", () => this.runGameConsole()],
      ["pause-simulator", () => this.pauseGameConsole()],
      ["reset-simulator", () => this.reset()],
      ["step-simulator", () => this.stepGameConsole()],
      ["share", () => this.showShareDialog()],
      ["open-file", () => this.openFile(), ["<Control>o"]],
      ["save-file", () => this.saveFile(), ["<Control>s"]],
      ["save-as-file", () => this.saveAsFile(), ["<Control><Shift>s"]],
      ["show-help", () => this.services.showHelp()],
    ];
    for (const [name, handler, accels] of bindings) {
      this.actions.set(
        name,
        this.shell.addAction(name, () => void handler(), accels)
      );
    }
  }

  private updateRunActions(state: SimulatorState): MainButtonState {
    const enabledState = mainStateController.getActionEnabledState(
      state,
      editorController.hasCode,
      this.codeToAssembleChanged
    );

    this.actions.get("assemble")?.setEnabled(enabledState.assemble);
    this.actions.get("run-simulator")?.setEnabled(enabledState.run);
    this.actions.get("resume-simulator")?.setEnabled(enabledState.resume);
    this.actions.get("pause-simulator")?.setEnabled(enabledState.pause);
    this.actions.get("reset-simulator")?.setEnabled(enabledState.reset);
    this.actions.get("step-simulator")?.setEnabled(enabledState.step);
    this.actions.get("share")?.setEnabled(enabledState.share);

    return this.parts.mainButton.updateFromSimulatorState(state);
  }

  // --- Views, layout ---

  private onActiveViewChanged(view: ViewType, previous: ViewType): void {
    this.updateLearnBackButtonVisibility();

    // Switching away from the console or debugger pauses a running program
    if (
      view !== previous &&
      (previous === ViewType.GAME_CONSOLE || previous === ViewType.DEBUGGER) &&
      this.state === SimulatorState.RUNNING
    ) {
      this.pauseGameConsole();
    }

    mainStateController.setViewType(view);
    if (view === ViewType.DEBUGGER) this.updateDebugger();
  }

  private onLayoutChanged(): void {
    this.updateLearnBackButtonVisibility();
    mainStateController.setViewType(this.activeView);
    this.updateRunActions(this.state);
  }

  private updateDebugger(): void {
    // The debugger updates while visible: the active page on mobile, always on desktop
    if (this.shell.isDesktopLayout() || this.activeView === ViewType.DEBUGGER) {
      this.parts.debugger.update(this.parts.gameConsole.memory, this.parts.gameConsole.simulator);
    }
  }

  private updateLearnBackButtonVisibility(): void {
    const isLearnVisible = this.activeView === ViewType.LEARN;
    const hasSubpage = this.parts.learn.hasVisibleSubpage;
    // On mobile the button belongs to the Learn tab only
    this.shell.setLearnBackVisible(hasSubpage && (this.shell.isDesktopLayout() || isLearnVisible));
  }

  // --- Files, closing ---

  public async openFile(): Promise<void> {
    if (this.unsavedChanges) {
      void this.askAboutUnsavedChanges("open");
      return;
    }

    const result = await this.services.files.openFile();
    if (result) {
      this.setEditorCode(result.content);
      this.shell.setFileTitle(result.filename);
      // TRANSLATORS: Toast message title after opening a file, includes filename
      this.showToast(formatMessage(_("Opened %s"), [result.filename]));
    }
  }

  public async saveFile(): Promise<boolean> {
    if (this.services.files.hasCurrentFile()) {
      return await this.services.files.saveFile(editorController.code);
    }
    return await this.saveAsFile();
  }

  public async saveAsFile(): Promise<boolean> {
    const { files } = this.services;
    const success = await files.saveFileAs(
      editorController.code,
      files.hasCurrentFile() ? files.getCurrentFileName() : "untitled.asm"
    );
    if (success) {
      this.shell.setFileTitle(files.getCurrentFileName());
      // TRANSLATORS: Toast message title after saving file successfully, includes filename
      this.showToast(formatMessage(_("Saved as %s"), [files.getCurrentFileName()]));
    }
    return success;
  }

  private async askAboutUnsavedChanges(action: "open" | "close"): Promise<void> {
    if (this.askingAboutUnsavedChanges) return;
    this.askingAboutUnsavedChanges = true;
    let answer;
    try {
      answer = await this.shell.askUnsavedChanges();
    } finally {
      this.askingAboutUnsavedChanges = false;
    }

    if (answer === "save") {
      if (!(await this.saveFile())) return;
    } else if (answer === "discard") {
      this.unsavedChanges = false;
    } else {
      return;
    }

    if (action === "open") void this.openFile();
    else this.shell.closeWindow();
  }

  private onCloseRequest(): boolean {
    if (this.unsavedChanges) {
      void this.askAboutUnsavedChanges("close");
      return true; // Block the close; the dialog's answer decides
    }

    this.parts.gameConsole.close();
    this.parts.debugger.close();
    return false;
  }
}
