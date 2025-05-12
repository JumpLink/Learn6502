import {
  EventDispatcher,
  type Memory,
  DisplayAddressRange,
} from "@learn6502/6502";
import { DEFAULT_COLOR_PALETTE } from "../data/display-constants";
import { hexToRgb } from "@learn6502/6502/src/utils";
import type {
  GamepadKey,
  GamepadEvent,
  GamepadEventMap,
  RGBColor,
} from "../types";
import type { DisplayWidget, GamepadWidget } from "../widgets/game-console";

/**
 * Platform-independent service that manages the entire game console functionality.
 * Combines display rendering and gamepad input handling into a single cohesive service.
 */
export class GameConsoleService {
  // Core properties
  private memory: Memory | null = null;
  private displayWidget: DisplayWidget | null = null;
  private gamepadWidget: GamepadWidget | null = null;

  // Event handling
  readonly events = new EventDispatcher<GamepadEventMap>();

  // Configuration properties
  private colorPalette: string[] = DEFAULT_COLOR_PALETTE;
  private inputEnabled: boolean = true;

  // Default key mappings from keyboard key codes to gamepad buttons
  private keyboardMappings: Record<number, GamepadKey> = {
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
   * Initialize the service with required components
   * @param options Configuration options including widgets and memory
   */
  public init(options: {
    displayWidget: DisplayWidget;
    gamepadWidget: GamepadWidget;
    memory: Memory;
  }): void {
    // Set up display
    this.displayWidget = options.displayWidget;

    // Set up gamepad
    this.gamepadWidget = options.gamepadWidget;

    // Listen to gamepad events and process them
    this.gamepadWidget.events.on("keyPressed", (event) => {
      // Handle keyPressed event from gamepad widget
      // Update memory if available
      if (this.memory) {
        const keyCode = event.keyCode || this.getKeyCodeForButton(event.key);
        this.memory.set(0xff, keyCode);
      }

      // Forward event to listeners
      this.events.dispatch("keyPressed", event);
    });

    // Set up memory
    this.memory = options.memory;

    if (!this.displayWidget || !this.gamepadWidget || !this.memory) {
      throw new Error("Missing required components");
    }

    // Initialize display widget with memory
    this.displayWidget.initialize(this.memory);
  }

  /**
   * Reset the display to its initial state
   */
  public resetDisplay(): void {
    this.displayWidget?.reset();
  }

  /**
   * Register custom key mappings for platform-specific keys
   * @param mappings Map of key codes to gamepad buttons
   */
  public registerKeyMappings(mappings: Record<number, GamepadKey>): void {
    this.keyboardMappings = { ...this.keyboardMappings, ...mappings };
  }

  //
  // Event Management
  //

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
   * Emit a gamepad event to all registered listeners
   * @param event Event data to dispatch
   */
  private emitEvent(event: GamepadEvent): void {
    this.events.dispatch("keyPressed", event);
  }

  //
  // Input Handling
  //

  /**
   * Process a gamepad key press
   * @param key Gamepad key identifier
   */
  public pressKey(key: GamepadKey): void {
    if (!this.inputEnabled) return;

    // Update gamepad widget if available
    // Dies löst das keyPressed-Event aus, das wir oben abonniert haben
    // und führt automatisch zur Aktualisierung des Speichers
    if (this.gamepadWidget) {
      this.gamepadWidget.press(key);
    } else {
      // Fallback, wenn kein Gamepad-Widget vorhanden ist
      // Aktualisiere den Speicher direkt
      if (this.memory) {
        const keyCode = this.getKeyCodeForButton(key);
        this.memory.set(0xff, keyCode);
      }

      // Emittiere das Event direkt
      this.emitEvent({
        key,
        keyCode: this.getKeyCodeForButton(key),
      });
    }
  }

  /**
   * Map a keyboard key code to a gamepad button
   * @param keyCode Physical key code
   * @returns Corresponding gamepad key if mapped, undefined otherwise
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return this.keyboardMappings[keyCode];
  }

  /**
   * Handle a keyboard key press event
   * @param keyCode Key code from the keyboard event
   * @returns True if the key was handled, false otherwise
   */
  public handleKeyPress(keyCode: number): boolean {
    if (!this.inputEnabled) return false;

    const gamepadKey = this.mapKeyToGamepad(keyCode);
    if (gamepadKey) {
      this.pressKey(gamepadKey);
      return true;
    }

    return false;
  }

  /**
   * Enable or disable gamepad input processing
   * @param enabled Whether input should be processed
   */
  public setInputEnabled(enabled: boolean): void {
    this.inputEnabled = enabled;
  }

  /**
   * Add a key controller to a component/widget
   * Platform-specific implementations will override this method
   * @param component The component to add key control to
   */
  public addKeyControllerTo(component: any): void {
    // This is a placeholder for platform-specific implementations
    console.warn("addKeyControllerTo not implemented for this platform");
  }

  /**
   * Get the ASCII value for a gamepad button
   * @param key The gamepad button
   * @returns ASCII code corresponding to the button
   */
  private getKeyCodeForButton(key: GamepadKey): number {
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

  //
  // Display Rendering
  //

  /**
   * Get the current color palette
   */
  get palette(): string[] {
    return this.colorPalette;
  }

  /**
   * Set a new color palette
   */
  set palette(value: string[]) {
    this.colorPalette = value;
  }

  /**
   * Convert a memory address to pixel coordinates
   * @param addr Memory address (0x200-0x5ff)
   * @param numX Number of pixels in x direction
   * @returns [x, y] coordinates
   */
  public addrToCoordinates(addr: number, numX: number): [number, number] {
    const offset = addr - DisplayAddressRange.START;
    const y = Math.floor(offset / numX);
    const x = offset % numX;
    return [x, y];
  }

  /**
   * Get the color for a specific memory address
   * @param addr Memory address
   * @returns RGB color object with values in 0-1 range
   */
  public getColorForAddress(addr: number): RGBColor {
    if (!this.memory) {
      throw new Error("Memory not initialized");
    }
    const value = this.memory.get(addr) & 0x0f;
    const hex = this.colorPalette[value];
    return hexToRgb(hex);
  }

  /**
   * Check if an address is in the display memory range
   * @param addr Memory address to check
   * @returns True if address is in display range (0x200-0x5ff)
   */
  public isDisplayAddress(addr: number): boolean {
    return addr >= DisplayAddressRange.START && addr <= DisplayAddressRange.END;
  }

  /**
   * Update a pixel in the display
   * @param addr Memory address for the pixel
   */
  public updatePixel(addr: number): void {
    if (this.isDisplayAddress(addr) && this.displayWidget) {
      this.displayWidget.updatePixel(addr);
    }
  }
}

// Export singleton instance
export const gameConsoleService = new GameConsoleService();
