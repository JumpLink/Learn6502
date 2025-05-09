import { BaseGamepadService } from "@learn6502/common-ui";
import type { GamepadEvent, GamepadKey } from "@learn6502/common-ui";
import { Observable } from "@nativescript/core";
import { EventData } from "@nativescript/core/data/observable";

// Create custom event type for gamepad events
export interface GamepadEventData extends EventData {
  key: GamepadKey;
  keyCode: number;
}

/**
 * Android-specific implementation of the GamepadService
 */
export class GamepadService extends BaseGamepadService {
  // Observable for event handling
  private _eventSource = new Observable();
  // Simulator memory
  private _memory: Uint8Array | null = null;

  constructor() {
    super();
    this.initKeyMappings();
  }

  /**
   * Initialize default key mappings for Android
   */
  protected initKeyMappings(): void {
    // WASD controls (keycode constants from Android KeyEvent)
    this.setKeyMapping(87, "Up"); // W
    this.setKeyMapping(83, "Down"); // S
    this.setKeyMapping(65, "Left"); // A
    this.setKeyMapping(68, "Right"); // D

    // Arrow keys
    this.setKeyMapping(19, "Up"); // KEYCODE_DPAD_UP
    this.setKeyMapping(20, "Down"); // KEYCODE_DPAD_DOWN
    this.setKeyMapping(21, "Left"); // KEYCODE_DPAD_LEFT
    this.setKeyMapping(22, "Right"); // KEYCODE_DPAD_RIGHT

    // Action keys
    this.setKeyMapping(66, "A"); // KEYCODE_ENTER
    this.setKeyMapping(81, "A"); // Q
    this.setKeyMapping(62, "B"); // KEYCODE_SPACE
    this.setKeyMapping(69, "B"); // E
  }

  /**
   * Set memory for gamepad inputs
   */
  public setMemory(memory: Uint8Array): void {
    this._memory = memory;
  }

  /**
   * Add key event listener
   */
  public addEventListener(callback: (args: GamepadEventData) => void): void {
    this._eventSource.on("keyPressed", callback);
  }

  /**
   * Remove key event listener
   */
  public removeEventListener(callback: (args: GamepadEventData) => void): void {
    this._eventSource.off("keyPressed", callback);
  }

  /**
   * Android-specific key event handler
   * This can be attached to an Android view's key event
   */
  public onKeyDown(keyCode: number): boolean {
    if (!this.enabled) return false;
    return this.handleKeyPress(keyCode);
  }

  /**
   * Set a key mapping
   */
  private setKeyMapping(keyCode: number, gamepadKey: GamepadKey): void {
    this.keyMappings[keyCode] = gamepadKey;
  }

  /**
   * Process key press and write to memory
   * @param key GamepadKey that was pressed
   * @param address Memory address to update
   */
  protected onKeyPress(key: GamepadKey, address: number): void {
    if (this._memory) {
      // Write 1 to memory at the specified address
      this._memory[address] = 1;
    }
  }

  /**
   * Emit gamepad event to listeners
   */
  protected emitGamepadEvent(event: GamepadEvent): void {
    this._eventSource.notify({
      eventName: "keyPressed",
      object: this._eventSource,
      key: event.key,
      keyCode: event.keyCode,
    } as GamepadEventData);
  }

  /**
   * Attach this controller to an Android view to receive key events
   */
  public attachToView(view: android.view.View): void {
    const controller = this;

    // Create key listener
    const keyListener = new android.view.View.OnKeyListener({
      onKey: function (
        v: android.view.View,
        keyCode: number,
        event: android.view.KeyEvent
      ): boolean {
        // Only process key down events
        if (event.getAction() === android.view.KeyEvent.ACTION_DOWN) {
          return controller.onKeyDown(keyCode);
        }
        return false;
      },
    });

    // Set the key listener on the view
    view.setOnKeyListener(keyListener);

    // Make sure the view can receive key events
    view.setFocusable(true);
    view.setFocusableInTouchMode(true);
  }
}
