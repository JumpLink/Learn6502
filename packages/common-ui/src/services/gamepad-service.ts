import type { GamepadKey, GamepadEvent, GamepadEventMap } from "../types";
import { EventDispatcher } from "@learn6502/6502";

/**
 * Common interface for gamepad services across platforms
 */
export interface GamepadService {
  /**
   * Press a gamepad key
   * @param key The key to press
   */
  pressKey(key: GamepadKey): void;

  /**
   * Map a physical key to a gamepad key
   * @param keyCode Physical key code
   * @returns Corresponding gamepad key if mapped, undefined otherwise
   */
  mapKeyToGamepad(keyCode: number): GamepadKey | undefined;

  /**
   * Handle a key press event
   * @param keyCode Key code from the event
   * @returns True if key was handled, false otherwise
   */
  handleKeyPress(keyCode: number): boolean;

  /**
   * Enable or disable gamepad input
   * @param enabled Whether gamepad input should be enabled
   */
  setEnabled(enabled: boolean): void;

  /**
   * Register a listener for gamepad key press events
   * @param callback Function to call when a key is pressed
   */
  addEventListener(
    event: keyof GamepadEventMap,
    callback: (event: GamepadEvent) => void
  ): void;

  /**
   * Remove a listener for gamepad key press events
   * @param callback Function to remove from listeners
   */
  removeEventListener(
    event: keyof GamepadEventMap,
    callback: (event: GamepadEvent) => void
  ): void;
}

/**
 * Base class implementing common gamepad functionality
 */
export abstract class BaseGamepadService implements GamepadService {
  protected enabled: boolean = true;

  // Event dispatcher for gamepad events
  protected events = new EventDispatcher<GamepadEventMap>();

  // Default key mappings
  protected keyMappings: Record<number, GamepadKey> = {};

  // Default key to address mappings (platform-specific implementations can override)
  protected keyToAddressMap: Record<GamepadKey, number> = {
    Up: 0xff,
    Down: 0xfe,
    Left: 0xfd,
    Right: 0xfc,
    A: 0xfb,
    B: 0xfa,
  };

  /**
   * Register a listener for gamepad events
   * @param event Event name to listen for
   * @param callback Function to call when the event occurs
   */
  public addEventListener(
    event: keyof GamepadEventMap,
    callback: (event: GamepadEvent) => void
  ): void {
    this.events.on(event, callback);
  }

  /**
   * Remove a listener for gamepad events
   * @param event Event name to remove listener from
   * @param callback Function to remove from listeners
   */
  public removeEventListener(
    event: keyof GamepadEventMap,
    callback: (event: GamepadEvent) => void
  ): void {
    this.events.off(event, callback);
  }

  /**
   * Press a gamepad key and write to simulated memory
   * @param key Gamepad key identifier
   */
  public pressKey(key: GamepadKey): void {
    if (!this.enabled) return;

    // Get address for the key
    const address = this.keyToAddressMap[key];
    if (address === undefined) return;

    // Write to memory (platform-specific implementation)
    this.onKeyPress(key, address);

    // Emit event for logging/UI feedback
    this.emitGamepadEvent({
      key,
      keyCode: address,
    });
  }

  /**
   * Map a physical key code to a gamepad key
   * @param keyCode Physical key code
   * @returns Mapped gamepad key or undefined
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return this.keyMappings[keyCode];
  }

  /**
   * Handle a key press from the host system
   * @param keyCode Key code from system event
   * @returns True if handled, false otherwise
   */
  public handleKeyPress(keyCode: number): boolean {
    if (!this.enabled) return false;

    const gamepadKey = this.mapKeyToGamepad(keyCode);
    if (gamepadKey) {
      this.pressKey(gamepadKey);
      return true;
    }

    return false;
  }

  /**
   * Enable or disable gamepad input
   * @param enabled Whether input should be processed
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Method to actually process key press in platform-specific way
   * @param key The gamepad key that was pressed
   * @param address Memory address to update
   */
  protected abstract onKeyPress(key: GamepadKey, address: number): void;

  /**
   * Emit gamepad event to listeners
   * @param event Gamepad event data
   */
  protected emitGamepadEvent(event: GamepadEvent): void {
    this.events.dispatch("keyPressed", event);
  }

  /**
   * Initialize platform-specific key mappings
   */
  protected abstract initKeyMappings(): void;
}
