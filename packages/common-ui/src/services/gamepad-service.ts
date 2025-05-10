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
  on(
    event: keyof GamepadEventMap,
    callback: (event: GamepadEvent) => void
  ): void;

  /**
   * Remove a listener for gamepad key press events
   * @param callback Function to remove from listeners
   */
  off(
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

  /**
   * Register a listener for gamepad events
   * @param event Event name to listen for
   * @param callback Function to call when the event occurs
   */
  public on(
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
  public off(
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

    // Write to memory (platform-specific implementation)
    this.onKeyPress(key);

    // Emit event for logging/UI feedback
    this.dispatch({
      key,
      keyCode: this.getKeyValue(key),
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
   */
  protected abstract onKeyPress(key: GamepadKey): void;

  /**
   * Emit gamepad event to listeners
   * @param event Gamepad event data
   */
  protected dispatch(event: GamepadEvent): void {
    this.events.dispatch("keyPressed", event);
  }

  /**
   * Initialize platform-specific key mappings
   */
  protected abstract initKeyMappings(): void;

  /**
   * Get the key value for storeKeypress method
   * This maps gamepad keys to the expected ASCII values
   */
  protected getKeyValue(key: GamepadKey): number {
    switch (key) {
      case "Up":
        return 119; // w
      case "Down":
        return 115; // s
      case "Left":
        return 97; // a
      case "Right":
        return 100; // d
      case "A":
        return 13; // Enter
      case "B":
        return 32; // Space
      default:
        return 0;
    }
  }
}
