import GObject from '@girs/gobject-2.0'
import Adw from '@girs/adw-1'
import Gtk from '@girs/gtk-4.0'
import Gdk from '@girs/gdk-4.0'
import Gio from '@girs/gio-2.0'
import GLib from '@girs/glib-2.0'

import { Learn } from './learn.ts'
import { Editor } from './editor.ts'
import { GameConsole } from './game-console.ts'
import { Debugger } from './debugger/index.ts'

import Template from './application-window.blp'
import { SimulatorState } from '@learn6502/6502'
import { type RunButtonMode, RunButtonState } from '../types/index.ts'

export class ApplicationWindow extends Adw.ApplicationWindow {

  // Child widgets
  declare private _editor: Editor
  declare private _gameConsole: GameConsole
  declare private _learn: Learn
  declare private _menuButton: Gtk.MenuButton
  declare private _runButton: Adw.SplitButton
  declare private _stack: Adw.ViewStack
  declare private _switcherBar: Adw.ViewSwitcherBar
  declare private _debugger: Debugger
  declare private _toastOverlay: Adw.ToastOverlay
  declare private _unsavedChangesDialog: Adw.AlertDialog
  declare private _titleLabel: Gtk.Label
  declare private _unsavedChangesIndicator: Gtk.Button

  static {
    GObject.registerClass({
      GTypeName: 'ApplicationWindow',
      Template,
      InternalChildren: ['editor', 'gameConsole', 'learn', 'menuButton', 'runButton', 'stack', 'switcherBar', 'debugger', 'toastOverlay', 'unsavedChangesDialog', 'titleLabel', 'unsavedChangesIndicator'],
    }, this);
  }

  // State
  private previousVisibleChild: Gtk.Widget | null = null
  private currentFile: Gio.File | null = null
  private pendingDialogAction: 'open' | 'close' | null = null
  private codeToAssembleChanged: boolean = false

  private set unsavedChanges(unsavedChanges: boolean) {
    this._unsavedChangesIndicator.visible = unsavedChanges;
    if(this.currentFile === null) {
      this._unsavedChangesIndicator.tooltip_text = _("Unsaved changes");
    } else {
      this._unsavedChangesIndicator.tooltip_text = _("File \"%s\" has unsaved changes").format(this.getCurrentFileName());
    }
  }

  private get unsavedChanges(): boolean {
    return this._unsavedChangesIndicator.visible;
  }

  // Actions
  private assembleAction = new Gio.SimpleAction({ name: 'assemble' });
  private runSimulatorAction = new Gio.SimpleAction({ name: 'run-simulator' });
  private resumeSimulatorAction = new Gio.SimpleAction({ name: 'resume-simulator' });
  private pauseSimulatorAction = new Gio.SimpleAction({ name: 'pause-simulator' });
  private resetSimulatorAction = new Gio.SimpleAction({ name: 'reset-simulator' });
  private stepSimulatorAction = new Gio.SimpleAction({ name: 'step-simulator' });

  // New file actions
  private openFileAction = new Gio.SimpleAction({ name: 'open-file' });
  private saveFileAction = new Gio.SimpleAction({ name: 'save-file' });
  private saveAsFileAction = new Gio.SimpleAction({ name: 'save-as-file' });

  private buttonModes: Record<RunButtonState, RunButtonMode> = {
    [RunButtonState.ASSEMBLE]: {
      iconName: 'build-alt-symbolic',
      tooltipText: _("Assemble"),
      actionName: 'assemble',
    },
    [RunButtonState.RUN]: {
      iconName: 'play-symbolic',
      tooltipText: _("Run"),
      actionName: 'run-simulator',
    },
    [RunButtonState.PAUSE]: {
      iconName: 'pause-symbolic',
      tooltipText: _("Pause"),
      actionName: 'pause-simulator',
    },
    [RunButtonState.RESUME]: {
      iconName: 'play-symbolic',
      tooltipText: _("Resume"),
      actionName: 'resume-simulator',
    },
    [RunButtonState.RESET]: {
      iconName: 'reset-symbolic',
      tooltipText: _("Reset"),
      actionName: 'reset-simulator',
    },
    [RunButtonState.STEP]: {
      iconName: 'step-over-symbolic',
      tooltipText: _("Step"),
      actionName: 'step-simulator',
    }
  }

  constructor(application: Adw.Application) {
    super({ application })
    this.setupGeneralSignalListeners();
    this.setupActions();
    this.setupFileActions();
    this.setupRunButton();
    this.setupGameConsoleSignalListeners();
    this.setupKeyboardListener();
    this.setupLearnTutorialSignalListeners();
    this.setupEditorSignalListeners();
    // Initialize the previous visible child after all setup is done
    this.previousVisibleChild = this._stack.get_visible_child();
  }

  public get state(): SimulatorState {
    return this._gameConsole.simulator.state;
  }

  private setupLearnTutorialSignalListeners(): void {
    this._learn.connect('copy', (_learn: Learn, code: string) => {
      this.setEditorCode(code);
      this.showToast({
        title: _("Code copied to editor"),
        timeout: 2
      });
    });
  }

  private setupEditorSignalListeners(): void {
    // Connect to text buffer's changed signal
    this._editor.connect('changed', () => {
      this.codeToAssembleChanged = true;
      this.unsavedChanges = true;

      this.updateRunActions(this._gameConsole.simulator.state);
    });
  }

  private setupGeneralSignalListeners(): void {
    this.connect('close-request', this.onCloseRequest.bind(this));
    this._stack.connect('notify::visible-child', this.onStackVisibleChildChanged.bind(this));
  }

  private onStackVisibleChildChanged(): void {
    const currentChild = this._stack.get_visible_child();

    // Save scroll position when navigating away from Learn view
    if (this.previousVisibleChild === this._learn && currentChild !== this._learn) {
      this._learn.saveScrollPosition();
    }

    // Restore scroll position when returning to Learn view
    // Only restore if we're coming from a different view
    if (currentChild === this._learn && this.previousVisibleChild !== this._learn) {
      // Make sure the Learn widget is properly mapped before restoring
      if (this._learn.get_mapped()) {
        this._learn.restoreScrollPosition();
      } else {
        // Connect a one-time handler to restore after mapping
        const handler = this._learn.connect('map', () => {
          this._learn.restoreScrollPosition();
          this._learn.disconnect(handler);
        });
      }
    }

    // Auto-pause program when switching away from game console or debugger while program is running
    if (this.previousVisibleChild === this._gameConsole || this.previousVisibleChild === this._debugger) {
      // Check if simulator is in running state
      const state = this._gameConsole.simulator.state;
      if (state === SimulatorState.RUNNING) {
        // Pause the program
        this.pauseGameConsole();
        this.showToast({
          title: _("Program paused automatically"),
          timeout: 2
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
      this.showUnsavedChangesDialog('close');
      return true; // Block the close and handle it in the dialog response
    }

    this._gameConsole.close();
    this._debugger.close();
    return false;
  }

  private setupActions(): void {
    this.assembleAction.connect('activate', this.assembleGameConsole.bind(this));
    this.add_action(this.assembleAction);

    this.runSimulatorAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(this.runSimulatorAction);

    this.resumeSimulatorAction.connect('activate', this.runGameConsole.bind(this));
    this.add_action(this.resumeSimulatorAction);

    this.pauseSimulatorAction.connect('activate', this.pauseGameConsole.bind(this));
    this.add_action(this.pauseSimulatorAction);

    this.resetSimulatorAction.connect('activate', this.resetGameConsole.bind(this));
    this.add_action(this.resetSimulatorAction);

    this.stepSimulatorAction.connect('activate', this.stepGameConsole.bind(this));
    this.add_action(this.stepSimulatorAction);
  }

  private setupFileActions(): void {
    // Open file action
    this.openFileAction.connect('activate', this.openFile.bind(this));
    this.add_action(this.openFileAction);

    // Save file action
    this.saveFileAction.connect('activate', this.saveFile.bind(this));
    this.add_action(this.saveFileAction);

    // Save as file action
    this.saveAsFileAction.connect('activate', this.saveAsFile.bind(this));
    this.add_action(this.saveAsFileAction);

    // Set keyboard shortcuts
    const app = this.get_application();
    if (app) {
      app.set_accels_for_action(`win.${this.openFileAction.get_name()}`, ['<Control>o']);
      app.set_accels_for_action(`win.${this.saveFileAction.get_name()}`, ['<Control>s']);
      app.set_accels_for_action(`win.${this.saveAsFileAction.get_name()}`, ['<Control><Shift>s']);
    }

    // Connect unsaved changes dialog responses
    this._unsavedChangesDialog.connect('response', this.onUnsavedChangesResponse.bind(this));
  }

  private setupRunButton(): void {
    // Initial button setup
    this.updateRunActions(this._gameConsole.simulator.state);
  }

  private runGameConsole(): void {
    const visibleChild = this._stack.get_visible_child();
    // Set the game console as the visible child in the stack if it's not already visible or the debugger
    if (visibleChild !== this._gameConsole) {
      this._stack.set_visible_child(this._gameConsole);
    }
    this._gameConsole.run();
  }

  private pauseGameConsole(): void {
    this._gameConsole.stop();
  }

  private resetGameConsole(): void {
    this._gameConsole.reset();
  }

  private assembleGameConsole(): void {
    this._debugger.reset();
    const visibleChild = this._stack.get_visible_child();
    // Set the debugger as the visible child in the stack if it's not already visible or the game console
    if (visibleChild !== this._debugger) {
      this._stack.set_visible_child(this._debugger);
    }
    // Reset the code changed flag BEFORE assembling
    this.codeToAssembleChanged = false;
    this._gameConsole.assemble(this._editor.code);
  }

  private setEditorCode(code: string): void {
    this._editor.code = code;
    // Set the editor as the visible child in the stack
    this._stack.set_visible_child(this._editor);

    // Reset the code changed flag after setting code
    this.codeToAssembleChanged = false;
    this.unsavedChanges = false;
  }

  private showToast(params: Partial<Adw.Toast.ConstructorProps>): void {
    const toast = new Adw.Toast(params);
    this._toastOverlay.add_toast(toast);
  }

  private updateDebugger(): void {
    // Only update the debugger if it's the visible child
    if (this._stack.get_visible_child() === this._debugger) {
      this._debugger.update(this._gameConsole.memory, this._gameConsole.simulator);
    }
  }

  private setupGameConsoleSignalListeners(): void {
    this._gameConsole.connect('assemble-success', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this._debugger.updateHexdump(this._gameConsole.assembler);

      this.onSimulatorStateChange(this._gameConsole.simulator.state);

      this.showToast({
        title: _("Assembled successfully"),
        timeout: 2
      });
    })

    this._gameConsole.connect('assemble-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: _("Assemble failed"),
        timeout: 2
      });
    })

    this._gameConsole.connect('hexdump', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('disassembly', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('assemble-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('stop', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('start', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('reset', (_gameConsole, signal) => {
      this.onSimulatorStateChange(signal.state);
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('step', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      // If stepper is enabled, update the debug info and the monitor every step
      if (this._gameConsole.simulator.stepperEnabled) {
        this.updateDebugger();
      }
    })

    this._gameConsole.connect('multistep', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.updateDebugger();
    })

    this._gameConsole.connect('goto', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.updateDebugger();
    })

    this._gameConsole.connect('simulator-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('simulator-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: _("Simulator failure"),
        timeout: 2
      });
    })

    this._gameConsole.connect('labels-info', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }
    })

    this._gameConsole.connect('labels-failure', (_gameConsole, signal) => {
      if(signal.message) {
        this._debugger.log(signal.message);
      }

      this.showToast({
        title: _("Labels failure"),
        timeout: 2
      });
    })

    this._gameConsole.connect('gamepad-pressed', (_gameConsole, key) => {
      this._debugger.log(`Gamepad key pressed: ${key}`);
    })
  }

  private setupKeyboardListener(): void {
    // Add a controller to handle key events
    const keyController = new Gtk.EventControllerKey();
    this.add_controller(keyController);

    keyController.connect('key-pressed', (_controller, keyval, keycode, state) => {
      // Handle the key press event
      this.handleKeyPress(keyval);
      return false;
    });
  }

  private handleKeyPress(keyval: number): void {
    switch (keyval) {
      case Gdk.KEY_w:
      case Gdk.KEY_Up:
        this._gameConsole.gamepadPress('Up');
        break;
      case Gdk.KEY_s:
      case Gdk.KEY_Down:
        this._gameConsole.gamepadPress('Down');
        break;
      case Gdk.KEY_a:
      case Gdk.KEY_Left:
        this._gameConsole.gamepadPress('Left');
        break;
      case Gdk.KEY_d:
      case Gdk.KEY_Right:
        this._gameConsole.gamepadPress('Right');
        break;
      case Gdk.KEY_Return:
        this._gameConsole.gamepadPress('A');
        break;
      case Gdk.KEY_space:
        this._gameConsole.gamepadPress('B');
        break;
    }
  }

  private onSimulatorStateChange(state: SimulatorState): void {
    this.updateDebugger();
    this.updateRunActions(state);
  }

  private setButtonMode(state: RunButtonState): void {
    const actionName = this.buttonModes[state].actionName;
    this._runButton.set_icon_name(this.buttonModes[state].iconName);
    this._runButton.set_tooltip_text(this.buttonModes[state].tooltipText);
    this._runButton.set_action_name(`win.${actionName}`);
  }

  private updateRunActions(state: SimulatorState): RunButtonState {
    // Check if editor has code
    const hasCode = this._editor.hasCode;

    // Default: disable all actions
    this.runSimulatorAction.set_enabled(false);
    this.resumeSimulatorAction.set_enabled(false);
    this.pauseSimulatorAction.set_enabled(false);
    this.resetSimulatorAction.set_enabled(false);
    this.stepSimulatorAction.set_enabled(false);

    // Always enable assemble if there's code
    this.assembleAction.set_enabled(hasCode);

    // Clear the existing action for the main button
    this._runButton.set_action_name(null);

    let buttonState: RunButtonState;

    if (this.codeToAssembleChanged) {
      buttonState = RunButtonState.ASSEMBLE;
      this.setButtonMode(buttonState);
      return buttonState;
    }

    switch (state) {
      case SimulatorState.INITIALIZED:
        buttonState = RunButtonState.ASSEMBLE;
        break;

      case SimulatorState.RUNNING:
        buttonState = RunButtonState.PAUSE;

        // Enable pause action
        this.pauseSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.DEBUGGING:
        // Im Debugging-Modus verwenden wir den Step-Button als primären Button
        buttonState = RunButtonState.STEP;

        // Enable step, pause and reset actions
        this.stepSimulatorAction.set_enabled(true);
        this.pauseSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        this.runSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.COMPLETED:
        buttonState = RunButtonState.RESET;

        // Enable run, step and reset actions
        this.runSimulatorAction.set_enabled(true);
        this.stepSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.PAUSED:
        buttonState = RunButtonState.RESUME;

        // Enable resume, run, step and reset actions
        this.resumeSimulatorAction.set_enabled(true);
        this.runSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        this.stepSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.DEBUGGING_PAUSED:
        // Im Debugging-Paused Modus verwenden wir auch den Step-Button
        buttonState = RunButtonState.STEP;

        // Enable step, resume, run, and reset actions
        this.stepSimulatorAction.set_enabled(true);
        this.resumeSimulatorAction.set_enabled(true);
        this.runSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      case SimulatorState.READY:
        buttonState = RunButtonState.RUN;

        // Enable run, step and reset actions
        this.runSimulatorAction.set_enabled(true);
        this.stepSimulatorAction.set_enabled(true);
        this.resetSimulatorAction.set_enabled(true);
        break;

      default:
        throw new Error(`Unknown state: ${state}`);
    }

    this.setButtonMode(buttonState);
    return buttonState;
  }

  private stepGameConsole(): void {
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
      this.showUnsavedChangesDialog('open');
      return;
    }

    await this.openFileImpl();
  }

  private async openFileImpl(): Promise<void> {
    try {
      const fileDialog = new Gtk.FileDialog({
        title: _('Open Assembly File'),
        modal: true,
        filters: this.createFileFilters()
      });

      const file = await fileDialog.open(this, null);
      if (!file) return;

      const [contents] = await file.load_contents_async(null);
      if (!contents) {
        this.showToast({
          title: _("Failed to load file"),
          timeout: 2
        });
        return;
      }

      const fileContent = new TextDecoder().decode(contents);

      // Update editor with file contents
      this._editor.code = fileContent;
      this.currentFile = file;
      this.codeToAssembleChanged = false;
      this.unsavedChanges = false;

      // Switch to editor view
      this._stack.set_visible_child(this._editor);

      this.showToast({
        title: _("File loaded successfully"),
        timeout: 2
      });
    } catch (error) {
      console.error("Error opening file:", error);
      this.showToast({
        title: _("Error opening file"),
        timeout: 2
      });
    }
  }

  private async saveFile(): Promise<boolean> {
    this.unsavedChanges = false;
    if (this.currentFile) {
      return this.saveToFile(this.currentFile);
    } else {
      return this.saveAsFile();
    }
  }

  private getCurrentFileName(): string {
    if (!this.currentFile) return _("untitled") + ".asm";
    return this.currentFile.get_basename() || _("untitled") + ".asm";
  }

  private async saveAsFile(): Promise<boolean> {
    try {
      const fileDialog = new Gtk.FileDialog({
        title: _('Save Assembly File'),
        modal: true,
        filters: this.createFileFilters(),
        initial_name: this.getCurrentFileName()
      });

      const file = await fileDialog.save(this, null);
      if (!file) return false;

      return this.saveToFile(file);
    } catch (error) {
      console.error("Error in save as:", error);
      this.showToast({
        title: _("Error saving file"),
        timeout: 2
      });
      return false;
    }
  }

  private async saveToFile(file: Gio.File): Promise<boolean> {
    try {
      const content = this._editor.code;

      // Create a file output stream
      const stream = await file.replace_async(
        null,
        false,
        Gio.FileCreateFlags.NONE,
        GLib.PRIORITY_DEFAULT,
        null
      );

      // Convert string to bytes
      const bytes = new TextEncoder().encode(content);

      // Write the content
      await stream.write_bytes_async(new GLib.Bytes(bytes), GLib.PRIORITY_DEFAULT, null);
      await stream.close_async(GLib.PRIORITY_DEFAULT, null);

      this.currentFile = file;
      this.unsavedChanges = false;

      this.showToast({
        title: _("File saved successfully"),
        timeout: 2
      });
      return true;
    } catch (error) {
      console.error("Error saving file:", error);
      this.showToast({
        title: _("Error saving file"),
        timeout: 2
      });
      return false;
    }
  }

  private createFileFilters(): Gio.ListStore {
    const filters = new Gio.ListStore({ item_type: Gtk.FileFilter.$gtype });

    const asmFilter = Gtk.FileFilter.new();
    asmFilter.set_name(_("Assembly Files"));
    asmFilter.add_pattern("*.asm");
    asmFilter.add_pattern("*.s");

    const allFilter = Gtk.FileFilter.new();
    allFilter.set_name(_("All Files"));
    allFilter.add_pattern("*");

    filters.append(asmFilter);
    filters.append(allFilter);

    return filters;
  }

  private showUnsavedChangesDialog(action: 'open' | 'close'): void {
    // Store the action in a class property instead of using set_data
    this.pendingDialogAction = action;
    this._unsavedChangesDialog.present(this);
  }

  private onUnsavedChangesResponse(dialog: Adw.AlertDialog, response: string): void {
    // Get the action from the class property
    const action = this.pendingDialogAction;
    if (!action) return;

    switch (response) {
      case 'save':
        // Save and then continue with the action
        this.saveFile().then(success => {
          if (success) {
            if (action === 'open') {
              this.openFileImpl();
            } else if (action === 'close') {
              this._gameConsole.close();
              this._debugger.close();
              this.destroy();
            }
          }
        });
        break;

      case 'discard':
        // Discard changes and continue
        this.unsavedChanges = false;
        if (action === 'open') {
          this.openFileImpl();
        } else if (action === 'close') {
          this._gameConsole.close();
          this._debugger.close();
          this.destroy();
        }
        break;

      case 'cancel':
      default:
        // Do nothing
        break;
    }

    // Reset the pending action
    this.pendingDialogAction = null;
  }
}

GObject.type_ensure(ApplicationWindow.$gtype)
