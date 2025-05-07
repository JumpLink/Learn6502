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
export class GnomeGamepadController extends BaseGamepadController {
  // For GObject signals
  declare emit: (signal: string, ...args: any[]) => void;

  // Simulator memory
  private _memory: Uint8Array | null = null;

  constructor() {
    super();
    this.initKeyMappings();

    // Register GObject class
    GObject.registerClass(
      {
        GTypeName: "GnomeGamepadController",
        Signals: {
          "key-pressed": {
            param_types: [GObject.TYPE_STRING, GObject.TYPE_UINT],
          },
        },
      },
      this.constructor as any
    );
  }

  /**
   * Initialize default key mappings for GNOME
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
   * Set memory for gamepad inputs
   */
  public setMemory(memory: Uint8Array): void {
    this._memory = memory;
  }

  /**
   * Process key press and update memory
   */
  protected onKeyPress(key: GamepadKey, address: number): void {
    if (this._memory) {
      // Write 1 to memory at the corresponding address
      this._memory[address] = 1;
    }
  }

  /**
   * Emit GObject signal for gamepad events
   */
  protected emitGamepadEvent(event: GamepadEvent): void {
    // Emit GObject signal
    this.emit("key-pressed", event.key, event.keyCode);
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
}
