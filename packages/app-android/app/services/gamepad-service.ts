import { BaseGamepadService } from "@learn6502/common-ui";
import type {
  GamepadEvent,
  GamepadKey,
  GamepadEventMap,
} from "@learn6502/common-ui";
import type { Memory } from "@learn6502/6502";
/**
 * Android-specific implementation of the GamepadService
 */
export class GamepadService extends BaseGamepadService {
  // Simulator memory
  private _memory: Memory | null = null;

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
   * TODO: Move to base class
   */
  public setMemory(memory: Memory): void {
    this._memory = memory;
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
   * TODO: Move to base class
   */
  protected onKeyPress(key: GamepadKey): void {
    if (this._memory) {
      const keyValue = this.getKeyValue(key);
      if (keyValue !== 0) {
        this._memory.storeKeypress(keyValue);
      }
    }
  }

  /**
   * Attach this controller to an Android view to receive key events
   * @param nativeView The NativeScript native view to attach to
   */
  // TODO: Fix any type
  public attachToView(nativeView: any): void {
    // Only proceed on Android
    if (!global.isAndroid) return;

    const controller = this;

    // Get the native Android view
    const androidView = nativeView.android;
    if (!androidView) return;

    try {
      // In NativeScript, access the global android namespace
      const androidKeyEvent = android.view.KeyEvent.ACTION_DOWN;

      // Create key listener using Android native API
      const keyListener = new android.view.View.OnKeyListener({
        onKey: function (v: any, keyCode: number, event: any): boolean {
          // Only process key down events
          if (event.getAction() === androidKeyEvent) {
            return controller.onKeyDown(keyCode);
          }
          return false;
        },
      });

      // Set the key listener on the native Android view
      androidView.setOnKeyListener(keyListener);
      androidView.setFocusable(true);
      androidView.setFocusableInTouchMode(true);
    } catch (e) {
      console.error("Failed to attach gamepad controller to view:", e);
    }
  }
}
