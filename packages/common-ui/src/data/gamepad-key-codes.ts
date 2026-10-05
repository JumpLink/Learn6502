import type { GamepadKey } from "../types";

/**
 * Standard ASCII key codes for gamepad buttons.
 * These values are used across all platforms to ensure consistent behavior
 * in the 6502 simulator, which expects specific ASCII values at memory location 0xFF.
 */
export const GAMEPAD_KEY_CODES: Record<GamepadKey, number> = {
  // Directional controls (WASD keys)
  Up: 119, // w
  Down: 115, // s
  Left: 97, // a
  Right: 100, // d

  // Action buttons
  A: 13, // Enter/Return
  B: 32, // Space
} as const;

/**
 * Get the ASCII key code for a gamepad button.
 * @param key The gamepad button
 * @returns ASCII code corresponding to the button
 */
export function getGamepadKeyCode(key: GamepadKey): number {
  return GAMEPAD_KEY_CODES[key] ?? 0;
}

/**
 * Get the character representation of a gamepad button.
 * Useful for debugging and logging.
 * @param key The gamepad button
 * @returns Character representation of the key code
 */
export function getGamepadKeyChar(key: GamepadKey): string {
  const keyCode = getGamepadKeyCode(key);
  return keyCode > 0 ? String.fromCharCode(keyCode) : "";
}

/**
 * Map keyboard keys to gamepad key codes.
 * Converts WASD and common keys to their corresponding gamepad ASCII values.
 * @param keyboardKey The keyboard key (e.g., 'w', 'a', 's', 'd')
 * @param fallbackKeyCode Optional fallback value for unmapped keys
 * @returns ASCII code for the corresponding gamepad action
 */
export function mapKeyboardToGamepadKeyCode(keyboardKey: string, fallbackKeyCode?: number): number {
  switch (keyboardKey) {
    case "w":
      return GAMEPAD_KEY_CODES.Up;
    case "a":
      return GAMEPAD_KEY_CODES.Left;
    case "s":
      return GAMEPAD_KEY_CODES.Down;
    case "d":
      return GAMEPAD_KEY_CODES.Right;
    case "Enter":
      return GAMEPAD_KEY_CODES.A;
    case " ":
      return GAMEPAD_KEY_CODES.B;
    default:
      return fallbackKeyCode ?? 0;
  }
}

/**
 * Validate that a key code matches the expected gamepad key.
 * Useful for testing and debugging.
 * @param key The gamepad button
 * @param keyCode The key code to validate
 * @returns True if the key code matches the expected value
 */
export function isValidGamepadKeyCode(key: GamepadKey, keyCode: number): boolean {
  return getGamepadKeyCode(key) === keyCode;
}
