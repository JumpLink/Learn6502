import {
  EventDispatcher,
  type Memory,
  DisplayAddressRange,
  type Simulator,
  type Assembler,
  type Labels,
  type AssemblerSuccessEvent,
  type AssemblerFailureEvent,
  type AssemblerHexdumpEvent,
  type AssemblerDisassemblyEvent,
  type AssemblerInfoEvent,
  type SimulatorStartEvent,
  type SimulatorStepEvent,
  type SimulatorMultiStepEvent,
  type SimulatorResetEvent,
  type SimulatorStopEvent,
  type SimulatorGotoEvent,
  type SimulatorFailureEvent,
  type SimulatorInfoEvent,
  type SimulatorPseudoOpEvent,
  type LabelsInfoEvent,
  type LabelsFailureEvent,
} from "@learn6502/6502";
import { DEFAULT_COLOR_PALETTE } from "../data/display-constants";
import { hexToRgb } from "@learn6502/6502/src/utils";
import type {
  GamepadKey,
  GamepadEvent,
  GameConsoleEventMap,
  RGBColor,
} from "../types";
import type { DisplayWidget, GamepadWidget } from "../widgets/game-console";
import type { GameConsoleView } from "../views";

/**
 * Platform-independent controller that manages the entire game console functionality.
 * Combines display rendering and gamepad input handling into a single cohesive controller.
 */
class GameConsoleController implements GameConsoleView {
  // Core properties
  private _memory: Memory | null = null;
  private _simulator: Simulator | null = null;
  private _assembler: Assembler | null = null;
  private _labels: Labels | null = null;
  private displayWidget: DisplayWidget | null = null;
  private gamepadWidget: GamepadWidget | null = null;

  // Getters for public read-only access as required by GameConsoleView interface
  public get memory(): Memory | null {
    return this._memory;
  }

  public get simulator(): Simulator | null {
    return this._simulator;
  }

  public get assembler(): Assembler | null {
    return this._assembler;
  }

  public get labels(): Labels | null {
    return this._labels;
  }

  // Event handling
  readonly events = new EventDispatcher<GameConsoleEventMap>();

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
   * Initialize the controller with required components
   * @param options Configuration options including widgets and memory
   */
  public init(options: {
    displayWidget: DisplayWidget;
    gamepadWidget: GamepadWidget;
    memory: Memory;
    simulator?: Simulator;
    assembler?: Assembler;
    labels?: Labels;
  }): void {
    // Set up display
    this.displayWidget = options.displayWidget;

    // Set up gamepad
    this.gamepadWidget = options.gamepadWidget;

    // Listen to gamepad events and process them
    this.gamepadWidget.events.on("keyPressed", (event) => {
      // Handle keyPressed event from gamepad widget
      // Update memory if available
      if (this._memory) {
        const keyCode = event.keyCode || this.getKeyCodeForButton(event.key);
        this._memory.set(0xff, keyCode);
      }

      // Forward event to listeners
      this.events.dispatch("keyPressed", event);
    });

    // Set up memory and other components
    this._memory = options.memory;
    this._simulator = options.simulator || null;
    this._assembler = options.assembler || null;
    this._labels = options.labels || null;

    if (!this.displayWidget || !this.gamepadWidget || !this._memory) {
      throw new Error("Missing required components");
    }

    // Initialize display widget with memory
    this.displayWidget.initialize(this._memory);

    // Setup event listeners for simulator, assembler, and labels if available
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for assembler, simulator, and labels
   */
  private setupEventListeners(): void {
    if (this._assembler) {
      this._assembler.on("assemble-success", (event: AssemblerSuccessEvent) => {
        if (this._memory && this._assembler) {
          this._memory.set(this._assembler.getCurrentPC(), 0x00); // Set a null byte at the end of the code
        }
        // Forward the event
        this.events.dispatch("assemble-success", event);
      });

      this._assembler.on("assemble-failure", (event: AssemblerFailureEvent) => {
        this.events.dispatch("assemble-failure", event);
      });

      this._assembler.on("hexdump", (event: AssemblerHexdumpEvent) => {
        this.events.dispatch("hexdump", event);
      });

      this._assembler.on("disassembly", (event: AssemblerDisassemblyEvent) => {
        this.events.dispatch("disassembly", event);
      });

      this._assembler.on("assemble-info", (event: AssemblerInfoEvent) => {
        this.events.dispatch("assemble-info", event);
      });
    }

    if (this._simulator) {
      this._simulator.on("stop", (event: SimulatorStopEvent) => {
        this.events.dispatch("stop", event);
      });

      this._simulator.on("start", (event: SimulatorStartEvent) => {
        this.events.dispatch("start", event);
      });

      this._simulator.on("reset", (event: SimulatorResetEvent) => {
        this.events.dispatch("reset", event);
      });

      this._simulator.on("step", (event: SimulatorStepEvent) => {
        this.events.dispatch("step", event);
      });

      this._simulator.on("multistep", (event: SimulatorMultiStepEvent) => {
        this.events.dispatch("multistep", event);
      });

      this._simulator.on("goto", (event: SimulatorGotoEvent) => {
        this.events.dispatch("goto", event);
      });

      this._simulator.on("pseudo-op", (event: SimulatorPseudoOpEvent) => {
        this.events.dispatch("pseudo-op", event);
      });

      this._simulator.on("simulator-info", (event: SimulatorInfoEvent) => {
        this.events.dispatch("simulator-info", event);
      });

      this._simulator.on(
        "simulator-failure",
        (event: SimulatorFailureEvent) => {
          this.events.dispatch("simulator-failure", event);
        }
      );
    }

    if (this._labels) {
      this._labels.on("labels-info", (event: LabelsInfoEvent) => {
        this.events.dispatch("labels-info", event);
      });

      this._labels.on("labels-failure", (event: LabelsFailureEvent) => {
        this.events.dispatch("labels-failure", event);
      });
    }
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
   * Register a listener for any game console event
   * @param event Event name to listen for
   * @param callback Function to call when the event occurs
   */
  public on<K extends keyof GameConsoleEventMap>(
    event: K,
    callback: (event: GameConsoleEventMap[K]) => void
  ): void {
    this.events.on(event, callback);
  }

  /**
   * Remove a listener for any game console event
   * @param event Event name to remove listener from
   * @param callback Function to remove from listeners
   */
  public off<K extends keyof GameConsoleEventMap>(
    event: K,
    callback: (event: GameConsoleEventMap[K]) => void
  ): void {
    this.events.off(event, callback);
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
    if (this.gamepadWidget) {
      this.gamepadWidget.press(key);
    } else {
      // Fallback if no gamepad widget is available
      // Update memory directly
      if (this._memory) {
        const keyCode = this.getKeyCodeForButton(key);
        this._memory.set(0xff, keyCode);
      }

      // Emit the event directly
      this.events.dispatch("keyPressed", {
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
  // Game Console Actions
  //

  /**
   * Assemble code
   * @param code The code to assemble
   */
  public assemble(code: string): void {
    if (this._simulator) {
      this._simulator.reset();
    }
    if (this._labels) {
      this._labels.reset();
    }
    if (this._assembler) {
      this._assembler.assembleCode(code);
    }
  }

  /**
   * Run the simulator
   */
  public run(): void {
    if (this._simulator) {
      this._simulator.stopStepper();
      this._simulator.runBinary();
    }
  }

  /**
   * Generate hexdump
   */
  public hexdump(): void {
    if (this._assembler) {
      this._assembler.hexdump({
        includeAddress: false,
        includeSpaces: true,
        includeNewline: true,
      });
    }
  }

  /**
   * Disassemble code
   */
  public disassemble(): void {
    if (this._assembler) {
      this._assembler.disassemble();
    }
  }

  /**
   * Stop the simulator
   */
  public stop(): void {
    if (this._simulator) {
      this._simulator.stop();
    }
  }

  /**
   * Reset the simulator and labels
   */
  public reset(): void {
    if (this._simulator) {
      this._simulator.reset();
    }
    if (this._labels) {
      this._labels.reset();
    }
  }

  /**
   * Execute a single step
   */
  public step(): void {
    if (this._simulator) {
      this._simulator.debugExecStep();
    }
  }

  /**
   * Go to a specific address
   * @param address The address to go to
   */
  public goto(address: string): void {
    if (this._simulator) {
      this._simulator.gotoAddr(address);
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
   * Get the color for a specific memory address
   * @param addr Memory address
   * @returns RGB color object with values in 0-1 range
   */
  public getColorForAddress(addr: number): RGBColor {
    if (!this._memory) {
      console.error("Memory not initialized when getting color for address");
      // Return black as fallback
      return { red: 0, green: 0, blue: 0 };
    }

    try {
      const value = this._memory.get(addr) & 0x0f;
      const hex = this.colorPalette[value];
      return hexToRgb(hex);
    } catch (error) {
      console.error(
        `Error getting color for address 0x${addr.toString(16)}: ${error}`
      );
      // Return fallback color
      return { red: 1, green: 0, blue: 1 }; // Magenta to indicate error
    }
  }

  /**
   * Convert a memory address to pixel coordinates
   * @param addr Memory address (0x200-0x5ff)
   * @param numX Number of pixels in x direction
   * @returns [x, y] coordinates
   */
  public addrToCoordinates(addr: number, numX: number): [number, number] {
    if (!this.isDisplayAddress(addr)) {
      console.error(`Invalid display address: 0x${addr.toString(16)}`);
      return [0, 0]; // Return default coordinates
    }

    try {
      const offset = addr - DisplayAddressRange.START;
      const y = Math.floor(offset / numX);
      const x = offset % numX;
      return [x, y];
    } catch (error) {
      console.error(`Error converting address to coordinates: ${error}`);
      return [0, 0];
    }
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
   * Update a pixel in the display - enhanced with error logging
   * @param addr Memory address for the pixel
   */
  public updatePixel(addr: number): void {
    if (!this.isDisplayAddress(addr)) {
      console.error(
        `updatePixel called with invalid address: 0x${addr.toString(16)}`
      );
      return;
    }

    if (!this.displayWidget) {
      console.error("Display widget not initialized in updatePixel");
      return;
    }

    console.log(
      `GameConsoleController: Updating pixel at 0x${addr.toString(16)}`
    );

    try {
      this.displayWidget.updatePixel(addr);
    } catch (error) {
      console.error(`Error updating pixel at 0x${addr.toString(16)}: ${error}`);
    }
  }

  /**
   * Handle gamepad key press (implements GameConsoleView interface)
   * @param key Key that was pressed
   */
  public gamepadPress(key: GamepadKey): void {
    this.pressKey(key);
  }

  /**
   * Clean up resources when closing (implements GameConsoleView interface)
   */
  public close(): void {
    // Stop the simulator if running
    this.stop();

    // Clean up resources
    this._memory = null;
    this._simulator = null;
    this._assembler = null;
    this._labels = null;
    this.displayWidget = null;
    this.gamepadWidget = null;
  }

  /**
   * Initialize memory with test patterns to verify display functionality
   * @param pattern The pattern type to initialize
   */
  public initializeMemoryWithTestPattern(
    pattern: "gradient" | "colorChart" | "simple" = "simple"
  ): void {
    if (!this._memory) {
      console.error("Cannot initialize test pattern: Memory not initialized");
      return;
    }

    console.log(
      `GameConsoleController: Initializing memory with '${pattern}' test pattern`
    );

    switch (pattern) {
      case "gradient":
        this.initializeGradientPattern();
        break;
      case "colorChart":
        this.initializeColorChartPattern();
        break;
      case "simple":
      default:
        this.initializeSimplePattern();
        break;
    }

    // Force display refresh after setting test pattern
    this.refreshDisplay();
  }

  /**
   * Force the display to refresh/redraw
   */
  public refreshDisplay(): void {
    if (!this.displayWidget) {
      console.log(
        "GameConsoleController: Display widget not initialized, cannot refresh"
      );
      return;
    }

    console.log("GameConsoleController: Forcing display refresh");

    // Force an update by calling updatePixel with the first display address
    // This will trigger a full redraw in most implementations
    this.displayWidget.updatePixel(DisplayAddressRange.START);
  }

  /**
   * Initialize a simple test pattern with a color gradient
   */
  private initializeSimplePattern(): void {
    if (!this._memory) return;

    // Make sure the display area is clear
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      this._memory.set(addr, 0);
    }

    // Rectangle in the upper left corner with different colors
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const addr = DisplayAddressRange.START + i * 32 + j;
        const color = (i + j) % 16;
        this._memory.set(addr, color);
      }
    }

    // Set some specific pixels
    this._memory.set(0x300, 1); // White pixel
    this._memory.set(0x310, 2); // Red pixel
    this._memory.set(0x320, 3); // Cyan pixel
    this._memory.set(0x330, 4); // Purple pixel

    console.log("GameConsoleController: Simple test pattern initialized");
  }

  /**
   * Initialize a gradient pattern that shows all colors
   */
  private initializeGradientPattern(): void {
    if (!this._memory) return;

    const numX = 32; // Standard display width in pixels

    // Fill the display area with a gradient
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < numX; x++) {
        const addr = DisplayAddressRange.START + y * numX + x;
        const color = (x + y) % 16; // Use all 16 colors in a gradient
        this._memory.set(addr, color);
      }
    }

    console.log("GameConsoleController: Gradient test pattern initialized");
  }

  /**
   * Initialize a color chart showing all 16 colors
   */
  private initializeColorChartPattern(): void {
    if (!this._memory) return;

    const numX = 32; // Standard display width in pixels

    // Clear the display area
    for (
      let addr = DisplayAddressRange.START;
      addr <= DisplayAddressRange.END;
      addr++
    ) {
      this._memory.set(addr, 0);
    }

    // Draw 4x4 blocks of each color (0-15)
    for (let colorIndex = 0; colorIndex < 16; colorIndex++) {
      const startX = (colorIndex % 4) * 8;
      const startY = Math.floor(colorIndex / 4) * 8;

      for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
          const addr =
            DisplayAddressRange.START + (startY + y) * numX + (startX + x);
          this._memory.set(addr, colorIndex);
        }
      }
    }

    console.log("GameConsoleController: Color chart test pattern initialized");
  }
}

export const gameConsoleController = new GameConsoleController();
