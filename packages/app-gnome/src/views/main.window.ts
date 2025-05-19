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

import Template from "./main.window.blp";
import {
  type MainButtonState,
  type MainView,
  debuggerController,
  gameConsoleController,
} from "@learn6502/common-ui";

export class MainWindow extends Adw.ApplicationWindow implements MainView {
  // Child widgets
  declare private _editor: Editor;
  declare private _gameConsole: GameConsole;
  declare private _learn: Learn;
  declare private _menuButton: Gtk.MenuButton;
  declare private _mainButton: MainButton;
  declare private _stack: Adw.ViewStack;
  declare private _switcherBar: Adw.ViewSwitcherBar;
  declare private _debugger: Debugger;
  declare private _toastOverlay: Adw.ToastOverlay;
  declare private _unsavedChangesDialog: Adw.AlertDialog;
  declare private _titleLabel: Gtk.Label;
  declare private _unsavedChangesIndicator: Gtk.Button;
  declare private _buttonWindowMenu: Gio.MenuModel;
  static {
    GObject.registerClass(
      {
        GTypeName: "MainWindow",
        Template,
        InternalChildren: [
          "editor",
          "gameConsole",
          "learn",
          "menuButton",
          "mainButton",
          "stack",
          "switcherBar",
          "debugger",
          "toastOverlay",
          "unsavedChangesDialog",
          "titleLabel",
          "unsavedChangesIndicator",
          "buttonWindowMenu",
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

    // Initialize the previous visible child after all setup is done
    this.previousVisibleChild = this._stack.get_visible_child();
  }

  public get state(): SimulatorState {
    return this._gameConsole.simulator.state;
  }

  private setupLearnTutorialSignalListeners(): void {
    this._learn.events.on("copy", ({ code }) => {
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
      this.codeToAssembleChanged = true;
      this.unsavedChanges = true;

      // Update the main button to show it should be assembled
      this._mainButton.setCodeChanged(true);
      this.updateRunActions(this._gameConsole.simulator.state);
    });
  }

  private setupDebuggerSignalListeners(): void {
    debuggerController.on("copyToClipboard", this.onCopyToClipboard.bind(this));
    debuggerController.on("copyToEditor", this.onCopyToEditor.bind(this));
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

  private showHelp(): void {
    const helpWindow = new HelpWindow();
    helpWindow.present();
  }

  private setupMainButton(): void {
    // Initial button setup
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  public runGameConsole(): void {
    const visibleChild = this._stack.get_visible_child();
    // Set the game console as the visible child in the stack if it's not already visible or the debugger
    if (visibleChild !== this._gameConsole) {
      this._stack.set_visible_child(this._gameConsole);
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
    const visibleChild = this._stack.get_visible_child();
    // Set the debugger as the visible child in the stack if it's not already visible or the game console
    if (visibleChild !== this._debugger) {
      this._stack.set_visible_child(this._debugger);
    }
    // Reset the code changed flag BEFORE assembling
    this.codeToAssembleChanged = false;
    this._mainButton.setCodeChanged(false);
    this._gameConsole.assemble(this._editor.code);
  }

  public setEditorCode(code: string): void {
    this._editor.code = code;
    // Set the editor as the visible child in the stack
    this._stack.set_visible_child(this._editor);

    // Reset the code changed flag after setting code
    this.codeToAssembleChanged = false;
    this._mainButton.setCodeChanged(false);
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

      this.onSimulatorStateChange(this._gameConsole.simulator.state);

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
      this.onSimulatorStateChange(signal.state);
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("start", (signal) => {
      this.onSimulatorStateChange(signal.state);
      if (signal.message) {
        const params = signal.params || [];
        this._debugger.log(_(signal.message).format(...params));
      }
    });

    gameConsoleController.on("reset", (signal) => {
      this.onSimulatorStateChange(signal.state);
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
  }

  private setupKeyboardListener(): void {
    // Plattformspezifischer Key-Controller für Gnome
    const keyController = new Gtk.EventControllerKey();
    this.add_controller(keyController);

    keyController.connect(
      "key-pressed",
      (_controller: any, keyval: number, keycode: number, state: any) => {
        return gameConsoleController.handleKeyPress(keyval);
      }
    );

    // Plattformspezifische Keycodes registrieren
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

    // Event-Listener für Gamepad-Eingaben
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

  // TODO: Migrate or make use of it
  private handleKeyPress(keyval: number): void {
    // Don't handle keys if a dialog is showing
    if (this.unsavedChanges) return;

    // Check keyboard shortcuts that apply in any view
    switch (keyval) {
      case Gdk.KEY_F5: // F5 to build
        this.assembleGameConsole();
        return;
      case Gdk.KEY_F6: // F6 to run
        if (
          this._gameConsole.simulator.state === SimulatorState.READY ||
          this._gameConsole.simulator.state === SimulatorState.PAUSED
        ) {
          this.runGameConsole();
        } else if (
          this._gameConsole.simulator.state === SimulatorState.RUNNING
        ) {
          this.pauseGameConsole();
        }
        return;
      case Gdk.KEY_F7: // F7 to step
        this.stepGameConsole();
        return;
    }

    // Let the gamepad service handle other keys
    // This is already handled by the key controller added in setupKeyboardListener
  }

  private onSimulatorStateChange(state: SimulatorState): void {
    console.log("onSimulatorStateChange", state);
    this.updateDebugger();
    this.updateRunActions(state);
  }

  private updateRunActions(state: SimulatorState): MainButtonState {
    // Check if editor has code
    const hasCode = this._editor.hasCode;

    // Get enabled states for actions from MainButton helper
    const enabledState = this._mainButton.getActionEnabledState(
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

    // Update the button state based on simulator state
    return this._mainButton.updateFromSimulatorState(state);
  }

  public stepGameConsole(): void {
    const visibleChild = this._stack.get_visible_child();
    // Set the debugger as the visible child in the stack if it's not already visible or the game console
    if (visibleChild !== this._debugger && visibleChild !== this._gameConsole) {
      this._stack.set_visible_child(this._debugger);
    }

    // Enable stepper if not already enabled
    if (!this._gameConsole.simulator.stepperEnabled) {
      this._gameConsole.simulator.enableStepper();
    }

    // Execute a single step
    this._gameConsole.simulator.debugExecStep();

    // Update the UI
    this.onSimulatorStateChange(this._gameConsole.simulator.state);
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
      return (await fileService.saveFile(this._editor.code)) || false;
    } else {
      return await this.saveAsFile();
    }
  }

  private getCurrentFileName(): string {
    return fileService.getCurrentFileName() || "";
  }

  private async saveAsFile(): Promise<boolean> {
    const success = await fileService.saveFileAs(
      this._editor.code,
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
    this._unsavedChangesDialog.present();
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
    // Add theme listener to update UI when theme changes
    themeService.addThemeChangeListener((mode, isDark) => {
      // Update UI elements that need to change with theme
      // For example, adjust code editor theme, etc.
      console.log(`Theme changed to ${mode}, isDark: ${isDark}`);
    });
  }
}

GObject.type_ensure(MainWindow.$gtype);
