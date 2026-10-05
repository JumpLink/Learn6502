import { type Memory } from "@learn6502/core";
import { getGamepadKeyCode } from "../data/index.ts";
import type { GamepadKey } from "../types/index.ts";

/**
 * Service containing platform-independent business logic for game console input management
 * Handles keyboard mappings, gamepad key processing, and input state
 */
export class GameConsoleInputService {
  // State tracking
  private _inputEnabled: boolean = true;

  // Default key mappings from keyboard key codes to gamepad buttons
  private _keyboardMappings: Record<number, GamepadKey> = {
    // WASD controls
    87: "Up", // W
    83: "Down", // S
    65: "Left", // A
    68: "Right", // D

    // Arrow keys
    38: "Up", // Up arrow
    40: "Down", // Down arrow
    37: "Left", // Left arrow
    39: "Right", // Right arrow

    // Action buttons
    13: "A", // Enter
    32: "B", // Space
  };

  /**
   * Get whether input is enabled
   */
  public get inputEnabled(): boolean {
    return this._inputEnabled;
  }

  /**
   * Set whether input should be enabled
   */
  public set inputEnabled(enabled: boolean) {
    this._inputEnabled = enabled;
  }

  /**
   * Get the current keyboard mappings
   */
  public get keyboardMappings(): Record<number, GamepadKey> {
    return { ...this._keyboardMappings };
  }

  /**
   * Register custom key mappings for platform-specific keys
   * @param mappings Map of key codes to gamepad buttons
   */
  public registerKeyMappings(mappings: Record<number, GamepadKey>): void {
    this._keyboardMappings = { ...this._keyboardMappings, ...mappings };
  }

  /**
   * Map a keyboard key code to a gamepad button
   * @param keyCode Physical key code
   * @returns Corresponding gamepad key if mapped, undefined otherwise
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return this._keyboardMappings[keyCode];
  }

  /**
   * Process a gamepad key press and update memory accordingly
   * @param key Gamepad key identifier
   * @param memory Memory instance to update
   * @returns Object with key information for event dispatching
   */
  public processGamepadKeyPress(key: GamepadKey, memory: Memory | null): { key: GamepadKey; keyCode: number } | null {
    if (!this._inputEnabled) {
      return null;
    }

    // Update memory if available
    if (memory) {
      const keyCode = getGamepadKeyCode(key);
      memory.set(0xff, keyCode);
    }

    return {
      key,
      keyCode: getGamepadKeyCode(key),
    };
  }

  /**
   * Handle a keyboard key press event
   * @param keyCode Key code from the keyboard event
   * @param memory Memory instance to update
   * @returns Object with key information if handled, null otherwise
   */
  public handleKeyPress(keyCode: number, memory: Memory | null): { key: GamepadKey; keyCode: number } | null {
    if (!this._inputEnabled) {
      return null;
    }

    const gamepadKey = this.mapKeyToGamepad(keyCode);
    if (gamepadKey) {
      return this.processGamepadKeyPress(gamepadKey, memory);
    }

    return null;
  }

  /**
   * Clear all input state (reset memory location 0xff to 0)
   * @param memory Memory instance to clear
   */
  public clearInputState(memory: Memory | null): void {
    if (memory) {
      memory.set(0xff, 0);
    }
  }

  /**
   * Check if a key code is mapped to any gamepad key
   * @param keyCode Key code to check
   * @returns True if key code is mapped
   */
  public isKeyMapped(keyCode: number): boolean {
    return keyCode in this._keyboardMappings;
  }

  /**
   * Get all mapped key codes
   * @returns Array of mapped key codes
   */
  public getMappedKeyCodes(): number[] {
    return Object.keys(this._keyboardMappings).map((code) => parseInt(code));
  }
}

// Export singleton instance
export const gameConsoleInputService = new GameConsoleInputService();
