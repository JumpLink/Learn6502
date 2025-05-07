import { BaseUIController } from "@learn6502/common-ui";
import { SimulatorState } from "@learn6502/6502";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";

/**
 * GNOME-specific implementation of the UIController
 */
export class GnomeUIController extends BaseUIController {
  private _window: Adw.ApplicationWindow;
  private _toastOverlay: Adw.ToastOverlay;
  private _unsavedChangesIndicator: Gtk.Button | null = null;
  private _unsavedChangesDialog: Adw.AlertDialog | null = null;
  private _pendingDialogAction: string | null = null;

  constructor(window: Adw.ApplicationWindow, toastOverlay: Adw.ToastOverlay) {
    super();
    this._window = window;
    this._toastOverlay = toastOverlay;
  }

  /**
   * Display toast message
   */
  public showToast(message: string, timeout: number = 2): void {
    const toast = new Adw.Toast({
      title: message,
      timeout: timeout,
    });
    this._toastOverlay.add_toast(toast);
  }

  /**
   * Handle unsaved changes
   */
  public async handleUnsavedChanges(action: string): Promise<boolean> {
    if (!this._unsavedChanges) {
      return true; // No unsaved changes, action can proceed
    }

    return new Promise<boolean>((resolve) => {
      if (!this._unsavedChangesDialog) {
        // Create dialog only if not already created
        this._unsavedChangesDialog = new Adw.AlertDialog({
          heading: _("Unsaved Changes"),
          body: _("Do you want to save the changes before continuing?"),
          close_response: "cancel",
          default_response: "save",
        });

        // Add actions
        this._unsavedChangesDialog.add_response("cancel", _("Cancel"));
        this._unsavedChangesDialog.add_response("discard", _("Discard"));
        this._unsavedChangesDialog.add_response("save", _("Save"));

        // Handler for responses
        this._unsavedChangesDialog.connect("response", (_dialog, response) => {
          switch (response) {
            case "save":
              // Signal that we should save (application must handle)
              resolve(true);
              break;
            case "discard":
              // Discard changes
              this.unsavedChanges = false;
              resolve(true);
              break;
            case "cancel":
            default:
              // Cancel action
              resolve(false);
              break;
          }
          this._pendingDialogAction = null;
        });
      }

      // Store current action and show dialog
      this._pendingDialogAction = action;
      this._unsavedChangesDialog.present(this._window);
    });
  }

  /**
   * Set the unsaved changes indicator
   */
  public setUnsavedChangesIndicator(indicator: Gtk.Button): void {
    this._unsavedChangesIndicator = indicator;
  }

  /**
   * Called when unsaved changes state changes
   */
  protected onUnsavedChangesChanged(hasUnsavedChanges: boolean): void {
    if (this._unsavedChangesIndicator) {
      this._unsavedChangesIndicator.visible = hasUnsavedChanges;
    }
  }

  /**
   * Called when simulator state changes
   */
  protected onSimulatorStateChanged(state: SimulatorState): void {
    // This method can be implemented by MainWindow
    // Here just a base handler
    const buttonState = this.getButtonStateFromSimulatorState(state);

    // Emit event signal that can be captured by MainWindow
    this.emitSimulatorStateChanged(state, buttonState);
  }

  /**
   * Emit signal for changed simulator state
   */
  private emitSimulatorStateChanged(
    state: SimulatorState,
    buttonState: any // Fix: using 'any' to resolve type error
  ): void {
    // In GNOME we could use GSignal,
    // but for simplicity we let the calling component handle it
  }
}
