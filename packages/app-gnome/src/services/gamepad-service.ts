import {
  type GamepadKey,
  BaseGamepadService,
  type GamepadEvent,
} from "@learn6502/common-ui";
import Gdk from "@girs/gdk-4.0";
import Gtk from "@girs/gtk-4.0";
import { Memory } from "@learn6502/6502";

/**
 * GNOME implementation of GamepadService
 */
class GamepadService extends BaseGamepadService {
  // Simulator memory
  private _memory: Memory | null = null;

  constructor() {
    super();
    this.initKeyMappings();
  }

  /**
   * Set memory for gamepad inputs
   * TODO: Move to base class
   */
  public setMemory(memory: Memory): void {
    this._memory = memory;
  }

  /**
   * Add key controller to a widget
   * @param widget The GTK widget that should receive keyboard events
   */
  public addKeyControllerTo(widget: Gtk.Widget): void {
    const keyController = new Gtk.EventControllerKey();
    widget.add_controller(keyController);

    keyController.connect(
      "key-pressed",
      (_controller: any, keyval: number, keycode: number, state: any) => {
        return this.handleKeyPress(keyval);
      }
    );
  }

  /**
   * Process key press and update memory
   * TODO: Move to base class
   */
  protected onKeyPress(key: GamepadKey): void {
    if (this._memory) {
      const keyValue = this.getKeyValue(key);
      if (keyValue !== 0) {
        this._memory.storeKeypress(keyValue);
        this.emitGamepadEvent({
          key,
          keyCode: keyValue,
        });
      }
    }
  }

  /**
   * Initialize default key mappings for GNOME
   * Implementation of abstract method from BaseGamepadService
   */
  protected initKeyMappings(): void {
    // WASD controls
    this.keyMappings[Gdk.KEY_w] = "Up";
    this.keyMappings[Gdk.KEY_s] = "Down";
    this.keyMappings[Gdk.KEY_a] = "Left";
    this.keyMappings[Gdk.KEY_d] = "Right";

    // Arrow keys
    this.keyMappings[Gdk.KEY_Up] = "Up";
    this.keyMappings[Gdk.KEY_Down] = "Down";
    this.keyMappings[Gdk.KEY_Left] = "Left";
    this.keyMappings[Gdk.KEY_Right] = "Right";

    // Action keys
    this.keyMappings[Gdk.KEY_Return] = "A"; // Enter
    this.keyMappings[Gdk.KEY_q] = "A";
    this.keyMappings[Gdk.KEY_space] = "B"; // Space
    this.keyMappings[Gdk.KEY_e] = "B";
  }

  /**
   * Press a gamepad key
   */
  public pressKey(key: GamepadKey): void {
    this.onKeyPress(key);
  }

  /**
   * Map a physical key to a gamepad key
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return this.keyMappings[keyCode];
  }

  /**
   * Handle a key press event
   */
  public handleKeyPress(keyCode: number): boolean {
    const key = this.mapKeyToGamepad(keyCode);
    if (key) {
      this.pressKey(key);
      return true;
    }
    return false;
  }

  /**
   * Enable or disable gamepad input
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Emit gamepad event to listeners
   * TODO: Move to base class
   */
  protected emitGamepadEvent(event: GamepadEvent): void {
    // Call parent class implementation to dispatch events
    this.events.dispatch("keyPressed", event);
  }
}

export const gamepadService = new GamepadService();
