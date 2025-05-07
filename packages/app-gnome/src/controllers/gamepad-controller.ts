import { BaseGamepadController } from "@learn6502/common-ui";
import type { GamepadEvent, GamepadKey } from "@learn6502/common-ui";
import Gdk from "@girs/gdk-4.0";
import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";

/**
 * Signal interface for GamepadController
 */
export interface GamepadSignals {
  "key-pressed": [key: GamepadKey, keyCode: number];
}

/**
 * GNOME-specific implementation of the GamepadController
 * Uses GObject signals for event handling
 */
export class GnomeGamepadController extends GObject.Object {
  // For GObject signals
  declare emit: (signal: string, ...args: any[]) => void;

  // Simulator memory
  private _memory: Uint8Array | null = null;

  // Delegation to BaseGamepadController implementation
  private _impl: GamepadControllerImpl;

  // Register GObject class
  static {
    GObject.registerClass(
      {
        GTypeName: "GnomeGamepadController",
        Signals: {
          "key-pressed": {
            param_types: [GObject.TYPE_STRING, GObject.TYPE_UINT],
          },
        },
      },
      this
    );
  }

  constructor() {
    super();
    this._impl = new GamepadControllerImpl();
    this.initKeyMappings();
  }

  /**
   * Initialize default key mappings for GNOME
   */
  public initKeyMappings(): void {
    // WASD controls
    this._impl.setKeyMapping(Gdk.KEY_w, "Up");
    this._impl.setKeyMapping(Gdk.KEY_s, "Down");
    this._impl.setKeyMapping(Gdk.KEY_a, "Left");
    this._impl.setKeyMapping(Gdk.KEY_d, "Right");

    // Arrow keys
    this._impl.setKeyMapping(Gdk.KEY_Up, "Up");
    this._impl.setKeyMapping(Gdk.KEY_Down, "Down");
    this._impl.setKeyMapping(Gdk.KEY_Left, "Left");
    this._impl.setKeyMapping(Gdk.KEY_Right, "Right");

    // Action keys
    this._impl.setKeyMapping(Gdk.KEY_Return, "A"); // Enter
    this._impl.setKeyMapping(Gdk.KEY_q, "A");
    this._impl.setKeyMapping(Gdk.KEY_space, "B"); // Space
    this._impl.setKeyMapping(Gdk.KEY_e, "B");
  }

  /**
   * Set memory for gamepad inputs
   */
  public setMemory(memory: Uint8Array): void {
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
   * Press a gamepad key
   */
  public pressKey(key: GamepadKey): void {
    const address = this._impl.getKeyAddress(key);
    if (address !== undefined) {
      this.processKeyPress(key, address);
    }
  }

  /**
   * Map a physical key to a gamepad key
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return this._impl.getKeyForCode(keyCode);
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
    this._impl.enabled = enabled;
  }

  /**
   * Process key press and update memory
   */
  private processKeyPress(key: GamepadKey, address: number): void {
    if (this._memory) {
      // Write 1 to memory at the corresponding address
      this._memory[address] = 1;
    }

    // Emit signal for notification
    this.emit("key-pressed", key, address);
  }
}

// Ensure type registration
GObject.type_ensure(GnomeGamepadController.$gtype);

/**
 * Helper implementation class to handle gamepad logic without GObject
 */
class GamepadControllerImpl {
  public enabled = true;
  private keyMappings: Record<number, GamepadKey> = {};
  private keyAddresses: Record<GamepadKey, number> = {
    Up: 0xff,
    Down: 0xfe,
    Left: 0xfd,
    Right: 0xfc,
    A: 0xfb,
    B: 0xfa,
  };

  /**
   * Set a key mapping
   */
  public setKeyMapping(keyCode: number, gamepadKey: GamepadKey): void {
    this.keyMappings[keyCode] = gamepadKey;
  }

  /**
   * Get gamepad key for a key code
   */
  public getKeyForCode(keyCode: number): GamepadKey | undefined {
    return this.keyMappings[keyCode];
  }

  /**
   * Get memory address for a gamepad key
   */
  public getKeyAddress(key: GamepadKey): number | undefined {
    return this.keyAddresses[key];
  }
}
