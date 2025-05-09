import { BaseUIService } from "@learn6502/common-ui";
import { SimulatorState } from "@learn6502/6502";
import { Application, Observable, Utils } from "@nativescript/core";
import { confirm } from "@nativescript/core/ui/dialogs";

/**
 * Android-specific implementation of the UIService
 */
export class UIService extends BaseUIService {
  private _eventSource = new Observable();

  constructor() {
    super();
  }

  /**
   * Display toast message using Android's native Toast
   */
  public showToast(message: string, timeout: number = 2): void {
    const context = Utils.android.getApplicationContext();
    if (context) {
      const duration = android.widget.Toast.LENGTH_SHORT;
      const toast = android.widget.Toast.makeText(context, message, duration);
      toast.show();
    }
  }

  /**
   * Handle unsaved changes with a confirmation dialog
   */
  public async handleUnsavedChanges(action: string): Promise<boolean> {
    if (!this._unsavedChanges) {
      return true; // No unsaved changes, action can proceed
    }

    try {
      const result = await confirm({
        title: "Unsaved Changes",
        message: "Do you want to save the changes before continuing?",
        okButtonText: "Save",
        cancelButtonText: "Cancel",
        neutralButtonText: "Discard",
      });

      if (result === true) {
        // User chose Save
        return true;
      } else if (result === undefined) {
        // User chose Discard (neutral button)
        this.unsavedChanges = false;
        return true;
      } else {
        // User chose Cancel
        return false;
      }
    } catch (error) {
      console.error("Error in unsaved changes dialog:", error);
      return false;
    }
  }

  /**
   * Called when unsaved changes state changes
   */
  protected onUnsavedChangesChanged(hasUnsavedChanges: boolean): void {
    // Notify any listeners about the change
    this._eventSource.notify({
      eventName: "unsavedChangesChanged",
      object: this._eventSource,
      hasUnsavedChanges,
    });
  }

  /**
   * Called when simulator state changes
   */
  protected onSimulatorStateChanged(state: SimulatorState): void {
    // Calculate appropriate button states based on simulator state
    const buttonState = this.getButtonStateFromSimulatorState(state);

    // Notify listeners of the state change
    this._eventSource.notify({
      eventName: "simulatorStateChanged",
      object: this._eventSource,
      state,
      buttonState,
    });
  }

  /**
   * Add event listener for UI events
   */
  public addEventListener(
    eventName: string,
    callback: (args: any) => void
  ): void {
    this._eventSource.on(eventName, callback);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(
    eventName: string,
    callback: (args: any) => void
  ): void {
    this._eventSource.off(eventName, callback);
  }
}
