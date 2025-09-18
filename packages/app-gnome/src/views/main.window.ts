import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gdk from "@girs/gdk-4.0";
import Gio from "@girs/gio-2.0";

import { SimulatorState, num2hex } from "@learn6502/6502";

import { Learn, Editor, GameConsole, Debugger } from "./main";
import { HelpWindow } from "./help.window.ts";
import { MainButton } from "../widgets";
import { copyToClipboard } from "../utils.ts";
import { themeService, notificationService, fileService } from "../services";
import { settings } from "../settings.ts";

import Template from "./main.window.blp";
import {
  type MainButtonState,
  type MainView,
  ViewType,
  debuggerController,
  gameConsoleController,
  mainStateController,
  editorController,
  learnController,
} from "@learn6502/common-ui";

export class MainWindow extends Adw.ApplicationWindow implements MainView {
  // Child widgets
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

  // Three column boxes
  declare private _leftColumn: Gtk.Box;
  declare private _centerColumn: Gtk.Box;
  declare private _rightTopBox: Gtk.Box;
  declare private _rightBottomBox: Gtk.Box;
  static {
    GObject.registerClass(
      {
        GTypeName: "MainWindow",
        Template,
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
          "leftColumn",
          "centerColumn",
          "rightTopBox",
          "rightBottomBox",
          "unsavedChangesDialog",
          "titleLabel",
          "unsavedChangesIndicator",
        ],
      },
      this
    );
  }

  // State
  private previousVisibleChild: Gtk.Widget | null = null;
  private currentFile: Gio.File | null = null;
  private pendingDialogAction: "open" | "close" | null = null;
  private codeToAssembleChanged: boolean = false;

  // Map from ViewType to widget
  private viewWidgetMap = new Map<ViewType, Gtk.Widget>();

  private set unsavedChanges(unsavedChanges: boolean) {
    fileService?.setUnsavedChanges(unsavedChanges);
  }

  private get unsavedChanges(): boolean {
    return this._unsavedChangesIndicator.visible;
  }

  // Simulator actions
  private assembleAction = new Gio.SimpleAction({ name: "assemble" });
  private runSimulatorAction = new Gio.SimpleAction({ name: "run-simulator" });
  private resumeSimulatorAction = new Gio.SimpleAction({
    name: "resume-simulator",
  });
  private pauseSimulatorAction = new Gio.SimpleAction({
    name: "pause-simulator",
  });
  private resetSimulatorAction = new Gio.SimpleAction({
    name: "reset-simulator",
  });
  private stepSimulatorAction = new Gio.SimpleAction({
    name: "step-simulator",
  });

  // File actions
  private openFileAction = new Gio.SimpleAction({ name: "open-file" });
  private saveFileAction = new Gio.SimpleAction({ name: "save-file" });
  private saveAsFileAction = new Gio.SimpleAction({ name: "save-as-file" });

  // Help actions
  private showHelpAction = new Gio.SimpleAction({ name: "show-help" });

  constructor(application: Adw.Application) {
    super({ application });

    // Initialize services
    fileService.init(this);
    fileService.setUnsavedChangesIndicator(this._unsavedChangesIndicator);

    themeService.init();

    notificationService.init(this, this._toastOverlay);

    // Mount layout based on current breakpoint mode and listen for changes
    const initialMode = this._layoutHost.get_visible_child_name();
    if (initialMode === "three") {
      this.mountThreeColumnLayout();
    } else {
      this.mountSingleLayout();
    }

    this._layoutHost.connect("notify::visible-child-name", () => {
      const mode = this._layoutHost.get_visible_child_name();
      if (mode === "three") {
        this.mountThreeColumnLayout();
      } else {
        this.mountSingleLayout();
      }
    });

    // Setup view to widget mapping
    this.viewWidgetMap.set(ViewType.LEARN, this._learn);
    this.viewWidgetMap.set(ViewType.EDITOR, this._editor);
    this.viewWidgetMap.set(ViewType.DEBUGGER, this._debugger);
    this.viewWidgetMap.set(ViewType.GAME_CONSOLE, this._gameConsole);

    // Initialize controllers and services
    this.setupGeneralSignalListeners();
    this.setupActions();
    this.setupFileActions();
    this.setupMainButton();
    this.setupGameConsoleSignalListeners();
    this.setupKeyboardListener();
    this.setupLearnTutorialSignalListeners();
    this.setupEditorSignalListeners();
    this.setupDebuggerSignalListeners();
    this.setupHelpActions();
    this.setupThemeManagement();
    this.setupMainStateEventListeners();

    // Initialize main state controller
    mainStateController.init();

    // Set game console reference in debugger
    this._debugger.setGameConsole(this._gameConsole);

    // Initialize the previous visible child after all setup is done
    this.previousVisibleChild = this._stack.get_visible_child();

    // Load and setup window size management
    this.loadWindowSize();
    this.setupWindowSizeSaving();
  }

  public get state(): SimulatorState {
    return this._gameConsole.simulator.state;
  }

  public get activeView(): ViewType {
    // Get current visible child and return the corresponding ViewType
    const visibleChild = this._stack.get_visible_child();
    for (const [viewType, widget] of this.viewWidgetMap.entries()) {
      if (widget === visibleChild) {
        return viewType;
      }
    }
    return ViewType.LEARN; // Default to LEARN if not found
  }

  /**
   * Navigates to a specific view/tab
   * @param viewType The view to navigate to
   */
  public navigateToView(viewType: ViewType): void {
    const widget = this.viewWidgetMap.get(viewType);
    if (widget) {
      this._stack.set_visible_child(widget);
    } else {
      console.error(`navigateToView: Widget not found for view ${viewType}`);
    }
  }

  private setupLearnTutorialSignalListeners(): void {
    learnController.on("copy", ({ code }: { code: string }) => {
      this.setEditorCode(code);
      this.showToast({
        title: _("Code copied to editor"),
        timeout: 2,
      });
    });
  }

  private setupEditorSignalListeners(): void {
    // Connect to text buffer's changed signal
    this._editor.events.on("changed", () => {
      this.unsavedChanges = true;

      // Use mainStateController to handle code changed state
      mainStateController.setCodeChanged(true);
    });
  }

  private setupDebuggerSignalListeners(): void {
    debuggerController.on("copyToClipboard", this.onCopyToClipboard.bind(this));
    debuggerController.on("copyToEditor", this.onCopyToEditor.bind(this));
    debuggerController.on("stepperToggled", this.onStepperToggled.bind(this));
  }

  private onCopyToClipboard(code: string): void {
    const success = copyToClipboard(code, this.get_clipboard());
    if (success) {
      this.showToast({
        title: _("Copied to clipboard"),
        timeout: 2,
      });
    } else {
      this.showToast({
        title: _("Failed to copy to clipboard"),
        timeout: 2,
      });
    }
  }

  private onCopyToEditor(code: string): void {
    this.setEditorCode(code);
  }

  private onStepperToggled(enabled: boolean): void {
    // Update the main button state when stepper changes
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  private setupGeneralSignalListeners(): void {
    this.connect("close-request", this.onCloseRequest.bind(this));
    this._stack.connect(
      "notify::visible-child",
      this.onStackVisibleChildChanged.bind(this)
    );
    this.connect("notify::is-active", this.onFocusChanged.bind(this));
  }

  private onStackVisibleChildChanged(): void {
    const currentChild = this._stack.get_visible_child();

    // Save scroll position when navigating away from Learn view
    if (
      this.previousVisibleChild === this._learn &&
      currentChild !== this._learn
    ) {
      this._learn.saveScrollPosition();
    }

    // Restore scroll position when returning to Learn view
    // Only restore if we're coming from a different view
    if (
      currentChild === this._learn &&
      this.previousVisibleChild !== this._learn
    ) {
      // Make sure the Learn widget is properly mapped before restoring
      if (this._learn.get_mapped()) {
        this._learn.restoreScrollPosition();
      } else {
        // Connect a one-time handler to restore after mapping
        const handler = this._learn.connect("map", () => {
          this._learn.restoreScrollPosition();
          try {
            this._learn.disconnect(handler);
          } catch (error) {
            console.error("[MainWindow] Failed to disconnect handler", error);
          }
        });
      }
    }

    // Auto-pause program when switching away from game console or debugger while program is running
    if (
      this.previousVisibleChild === this._gameConsole ||
      this.previousVisibleChild === this._debugger
    ) {
      // Check if simulator is in running state
      const state = this._gameConsole.simulator.state;
      if (state === SimulatorState.RUNNING) {
        // Pause the program
        this.pauseGameConsole();
        this.showToast({
          title: _("Program paused automatically"),
          timeout: 2,
        });
      }
    }

    // Update previous child
    this.previousVisibleChild = currentChild;

    // Update main state controller with current view type
    mainStateController.setViewType(this.activeView);

    if (currentChild === this._debugger) {
      this.updateDebugger();
    }
  }

  private onCloseRequest(): boolean {
    // Check for unsaved changes before closing
    if (this.unsavedChanges) {
      this.showUnsavedChangesDialog("close");
      return true; // Block the close and handle it in the dialog response
    }

    this._gameConsole.close();
    this._debugger.close();
    return false;
  }

  private onFocusChanged(): void {
    // Check if window has lost focus
    if (!this.is_active) {
      // Check if simulator is in running state
      const state = this._gameConsole.simulator.state;
      if (state === SimulatorState.RUNNING) {
        // Pause the program
        this.pauseGameConsole();
        this.showToast({
          title: _("Program paused automatically"),
          timeout: 2,
        });
      }
    }
  }

  private setupActions(): void {
    this.assembleAction.connect(
      "activate",
      this.assembleGameConsole.bind(this)
    );
    this.add_action(this.assembleAction);

    this.runSimulatorAction.connect("activate", this.runGameConsole.bind(this));
    this.add_action(this.runSimulatorAction);

    this.resumeSimulatorAction.connect(
      "activate",
      this.runGameConsole.bind(this)
    );
    this.add_action(this.resumeSimulatorAction);

    this.pauseSimulatorAction.connect(
      "activate",
      this.pauseGameConsole.bind(this)
    );
    this.add_action(this.pauseSimulatorAction);

    this.resetSimulatorAction.connect("activate", this.reset.bind(this));
    this.add_action(this.resetSimulatorAction);

    this.stepSimulatorAction.connect(
      "activate",
      this.stepGameConsole.bind(this)
    );
    this.add_action(this.stepSimulatorAction);
  }

  private setupFileActions(): void {
    // Open file action
    this.openFileAction.connect("activate", this.openFile.bind(this));
    this.add_action(this.openFileAction);

    // Save file action
    this.saveFileAction.connect("activate", this.saveFile.bind(this));
    this.add_action(this.saveFileAction);

    // Save as file action
    this.saveAsFileAction.connect("activate", this.saveAsFile.bind(this));
    this.add_action(this.saveAsFileAction);

    // Set keyboard shortcuts
    const app = this.get_application();
    if (app) {
      app.set_accels_for_action(`win.${this.openFileAction.get_name()}`, [
        "<Control>o",
      ]);
      app.set_accels_for_action(`win.${this.saveFileAction.get_name()}`, [
        "<Control>s",
      ]);
      app.set_accels_for_action(`win.${this.saveAsFileAction.get_name()}`, [
        "<Control><Shift>s",
      ]);
    }

    // Connect unsaved changes dialog responses
    this._unsavedChangesDialog.connect(
      "response",
      this.onUnsavedChangesResponse.bind(this)
    );
  }

  private setupHelpActions(): void {
    this.showHelpAction.connect("activate", this.showHelp.bind(this));
    this.add_action(this.showHelpAction);
  }

  private setupSingleStackPages(): void {
    // Ensure views are detached from any current parent before adding to stack
    this.detachFromParent(this._learn);
    this.detachFromParent(this._editor);
    this.detachFromParent(this._debugger);
    this.detachFromParent(this._gameConsole);

    // Remove existing pages
    const model: any = (this._stack as any).get_pages?.();
    if (model) {
      const toRemove: Gtk.Widget[] = [];
      const n: number = model.get_n_items?.() ?? 0;
      for (let i = 0; i < n; i++) {
        const page: any = model.get_item?.(i);
        const child: Gtk.Widget | undefined = page?.get_child?.();
        if (child) toRemove.push(child);
      }
      for (const child of toRemove) this._stack.remove(child);
    }

    // Add four pages
    (this._stack as any).add_titled_with_icon?.(
      this._learn,
      "learn",
      _("Learn"),
      "school-symbolic"
    );
    (this._stack as any).add_titled_with_icon?.(
      this._editor,
      "editor",
      _("Editor"),
      "code-symbolic"
    );
    (this._stack as any).add_titled_with_icon?.(
      this._debugger,
      "debugger",
      _("Debugger"),
      "bug-symbolic"
    );
    (this._stack as any).add_titled_with_icon?.(
      this._gameConsole,
      "gameConsole",
      _("Game Console"),
      "nintendo-controller-symbolic"
    );
  }

  // Mount single layout: all views in one PageStack
  private mountSingleLayout(): void {
    this.setupSingleStackPages();
    this._switcherBar.set_stack(this._stack);
  }

  // Mount three-column layout: Learn | Editor | (GameConsole over Debugger)
  private mountThreeColumnLayout(): void {
    // Clear containers
    this.clearBoxChildren(this._leftColumn);
    this.clearBoxChildren(this._centerColumn);
    this.clearBoxChildren(this._rightTopBox);
    this.clearBoxChildren(this._rightBottomBox);

    // Left: Learn
    this.detachFromParent(this._learn);
    this._leftColumn.append(this._learn);
    // Center: Editor
    this.detachFromParent(this._editor);
    this._centerColumn.append(this._editor);
    // Right top: Game Console
    this.detachFromParent(this._gameConsole);
    this._rightTopBox.append(this._gameConsole);
    // Right bottom: Debugger
    this.detachFromParent(this._debugger);
    this._rightBottomBox.append(this._debugger);

    // Detach bottom switcher in three-column mode
    this._switcherBar.set_stack(null as unknown as Adw.ViewStack);
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
    const parent = widget.get_parent();
    if (parent && (parent as any).remove) {
      (parent as any).remove(widget);
    }
  }

  private showHelp(): void {
    const helpWindow = new HelpWindow();
    helpWindow.present();
  }

  private setupMainButton(): void {
    // Initial button setup
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  public runGameConsole(): void {
    // Use platform-independent navigation logic
    const targetView = mainStateController.getNavigationTarget("run");
    if (targetView && targetView !== this.activeView) {
      this.navigateToView(targetView);
    }
    this._gameConsole.run();
  }

  public pauseGameConsole(): void {
    this._gameConsole.stop();
  }

  public reset(): void {
    this._gameConsole.reset();
    this._debugger.reset();
  }

  public assembleGameConsole(): void {
    this._debugger.reset();
    this.navigateToView(ViewType.DEBUGGER);

    // Reset the code changed flag BEFORE assembling using mainStateController
    mainStateController.setCodeChanged(false);
    this._gameConsole.assemble(editorController.code);
  }

  public setEditorCode(code: string): void {
    editorController.setCode(code);
    // Set the editor as the visible child in the stack
    this.navigateToView(ViewType.EDITOR);

    // Reset the code changed flag after setting code using mainStateController
    mainStateController.setCodeChanged(false);
    this.unsavedChanges = false;
  }

  private showToast(params: Partial<Adw.Toast.ConstructorProps>): void {
    notificationService.showNotification({
      title: params.title || "",
      timeout: params.timeout || 2,
    });
  }

  private updateDebugger(): void {
    // Only update the debugger if it's the visible child
    if (this._stack.get_visible_child() === this._debugger) {
      this._debugger.update(
        this._gameConsole.memory,
        this._gameConsole.simulator
      );
    }
  }

  private setupGameConsoleSignalListeners(): void {
    gameConsoleController.on("assemble-success", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this._debugger.updateHexdump(this._gameConsole.assembler);
      this._debugger.updateDisassembled(this._gameConsole.assembler);

      this.updateDebugger();
      this.updateRunActions(this._gameConsole.simulator.state);

      this.showToast({
        title: _("Assembled successfully"),
        timeout: 2,
      });
    });

    gameConsoleController.on("assemble-failure", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this.showToast({
        title: _("Assemble failed"),
        timeout: 2,
      });
    });

    gameConsoleController.on("hexdump", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(
          _("Hexdump:") + "\n" + _(signal.message).format(...params)
        );
      }
    });

    gameConsoleController.on("disassembly", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(
          _("Disassembly:") + "\n" + _(signal.message).format(...params)
        );
      }
    });

    gameConsoleController.on("assemble-info", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("stop", (signal) => {
      this.updateDebugger();
      this.updateRunActions(signal.state);
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("start", (signal) => {
      this.updateDebugger();
      this.updateRunActions(signal.state);
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("reset", (signal) => {
      this.updateDebugger();
      this.updateRunActions(signal.state);
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("step", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      // If stepper is enabled, update the debug info and the monitor every step
      if (this._gameConsole.simulator.stepperEnabled) {
        this.updateDebugger();
      }
    });

    gameConsoleController.on("multistep", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this.updateDebugger();
    });

    gameConsoleController.on("goto", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this.updateDebugger();
    });

    gameConsoleController.on("simulator-info", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("simulator-failure", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this.showToast({
        title: _("Simulator failure"),
        timeout: 2,
      });
    });

    gameConsoleController.on("labels-info", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("labels-failure", (signal) => {
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }

      this.showToast({
        title: _("Labels failure"),
        timeout: 2,
      });
    });

    // Listen for stepper state changes from game console
    gameConsoleController.on(
      "stepper-changed",
      (event: { enabled: boolean }) => {
        // Update debugger controller stepper state to match
        if (debuggerController.stepperEnabled !== event.enabled) {
          debuggerController.stepperEnabled = event.enabled;
        }
      }
    );
  }

  private setupKeyboardListener(): void {
    // Platform-specific key controller for GNOME
    const keyController = new Gtk.EventControllerKey();
    this.add_controller(keyController);

    keyController.connect(
      "key-pressed",
      (_controller: any, keyval: number, keycode: number, state: any) => {
        return gameConsoleController.handleKeyPress(keyval);
      }
    );

    // Register platform-specific keycodes
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

    // Event listener for gamepad inputs
    gameConsoleController.on("keyPressed", (event) => {
      // If we're in the game console or debugger view, log the key press
      const visibleChild = this._stack.get_visible_child();
      if (
        visibleChild === this._gameConsole ||
        visibleChild === this._debugger
      ) {
        this._debugger.log(
          _("Gamepad key pressed:") +
            " $" +
            num2hex(event.keyCode).toUpperCase()
        );
      }
    });
  }

  private updateRunActions(state: SimulatorState): MainButtonState {
    // Check if editor has code
    const hasCode = editorController.hasCode;

    // Get enabled states for actions from MainButton helper
    const enabledState = mainStateController.getActionEnabledState(
      state,
      hasCode,
      this.codeToAssembleChanged
    );

    // Set enabled state for all actions
    this.assembleAction.set_enabled(enabledState.assemble);
    this.runSimulatorAction.set_enabled(enabledState.run);
    this.resumeSimulatorAction.set_enabled(enabledState.resume);
    this.pauseSimulatorAction.set_enabled(enabledState.pause);
    this.resetSimulatorAction.set_enabled(enabledState.reset);
    this.stepSimulatorAction.set_enabled(enabledState.step);

    // Update the button state based on simulator state and current view
    return this._mainButton.updateFromSimulatorState(state);
  }

  public stepGameConsole(): void {
    // Use platform-independent navigation logic
    const targetView = mainStateController.getNavigationTarget("step");
    if (targetView && targetView !== this.activeView) {
      this.navigateToView(targetView);
    }

    // Enable stepper using debugger controller (this will sync UI properly)
    if (!debuggerController.stepperEnabled) {
      debuggerController.stepperEnabled = true;
    }

    // Execute a single step
    this._gameConsole.simulator.debugExecStep();

    // Update the UI
    this.updateDebugger();
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  private async openFile(): Promise<void> {
    // Check for unsaved changes first
    if (this.unsavedChanges) {
      this.showUnsavedChangesDialog("open");
      return;
    }

    const result = await fileService.openFile();
    if (result) {
      this.setEditorCode(result.content);
      this.currentFile = fileService.getCurrentGioFile() || null;
      this._titleLabel.label = result.filename;
      this.showToast({
        title: _("Opened %s").format(result.filename),
        timeout: 2,
      });
    }
  }

  private async saveFile(): Promise<boolean> {
    if (this.currentFile) {
      return (await fileService.saveFile(editorController.code)) || false;
    } else {
      return await this.saveAsFile();
    }
  }

  private getCurrentFileName(): string {
    return fileService.getCurrentFileName() || "";
  }

  private async saveAsFile(): Promise<boolean> {
    const success = await fileService.saveFileAs(
      editorController.code,
      this.currentFile ? this.getCurrentFileName() : "untitled.asm"
    );
    if (success) {
      this.currentFile = fileService.getCurrentGioFile() || null;
      this._titleLabel.label = this.getCurrentFileName();
      this.showToast({
        title: _("Saved as %s").format(this.getCurrentFileName()),
        timeout: 2,
      });
    }
    return success || false;
  }

  private showUnsavedChangesDialog(action: "open" | "close"): void {
    this.pendingDialogAction = action;
    this._unsavedChangesDialog.present(this);
  }

  private onUnsavedChangesResponse(
    dialog: Adw.AlertDialog,
    response: string
  ): void {
    switch (response) {
      case "save":
        // Save file then continue with pending action
        this.saveFile().then((success) => {
          if (success && this.pendingDialogAction === "open") {
            // After saving, continue with opening new file
            this.openFile();
          } else if (success && this.pendingDialogAction === "close") {
            // After saving, continue with closing
            this.close();
          }
        });
        break;
      case "discard":
        // Discard changes and continue with pending action
        this.unsavedChanges = false;
        if (this.pendingDialogAction === "open") {
          this.openFile();
        } else if (this.pendingDialogAction === "close") {
          this.close();
        }
        break;
      case "cancel":
      default:
        // Do nothing, cancel the operation
        break;
    }
    this.pendingDialogAction = null;
  }

  private setupThemeManagement(): void {
    // Register this window to receive mode/accent classes automatically
    themeService.registerThemedWidget(this);
  }

  private setupMainStateEventListeners(): void {
    // Listen for state changes
    mainStateController.events.on("state-changed", (state) => {
      // React on main state changes by updating run actions
      this.updateRunActions(this._gameConsole.simulator.state);
    });

    // Listen for code changed events
    mainStateController.events.on("state-changed:code-changed", (changed) => {
      this.codeToAssembleChanged = changed;
      this.updateRunActions(this._gameConsole.simulator.state);
    });
  }

  private loadWindowSize(): void {
    try {
      const width = settings.get_int("window-width");
      const height = settings.get_int("window-height");
      const isMaximized = settings.get_boolean("is-maximized");

      if (isMaximized) {
        this.maximize();
      } else {
        this.set_default_size(width, height);
      }
    } catch (error) {
      console.warn("Could not load window size from settings:", error);
      // Fallback to Blueprint defaults
    }
  }

  private setupWindowSizeSaving(): void {
    // Save window size when it changes
    this.connect("notify::default-width", () => this.saveWindowSize());
    this.connect("notify::default-height", () => this.saveWindowSize());

    // Save maximized state
    this.connect("notify::maximized", () => {
      const isMaximized = this.is_maximized();
      settings.set_boolean("is-maximized", isMaximized);
    });
  }

  private saveWindowSize(): void {
    if (this.is_maximized()) {
      return; // Don't save size when maximized
    }

    try {
      const [width, height] = this.get_default_size();
      settings.set_int("window-width", width);
      settings.set_int("window-height", height);
    } catch (error) {
      console.warn("Could not save window size to settings:", error);
    }
  }
}

GObject.type_ensure(MainWindow.$gtype);
