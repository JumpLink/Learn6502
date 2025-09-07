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
import { DEFAULT_COLOR_PALETTE, getGamepadKeyCode } from "../data";
import { hexToRgb } from "@learn6502/6502/src/utils";
import type {
  GamepadKey,
  GamepadEvent,
  GameConsoleEventMap,
  RGBColor,
} from "../types";
import type { DisplayWidget, GamepadWidget } from "../widgets/game-console";
import {
  gameConsoleStateService,
  gameConsoleInputService,
} from "../services/index.ts";

/**
 * Platform-independent controller that manages the entire game console functionality.
 * Acts as a coordinator between game console state service, input service and UI widgets.
 */
class GameConsoleController {
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

    // Listen to gamepad events and process them only if gamepadWidget is available
    if (this.gamepadWidget && this.gamepadWidget.events) {
      this.gamepadWidget.events.on("keyPressed", (event) => {
        if (this._memory) {
          const keyCode = event.keyCode || getGamepadKeyCode(event.key);
          this._memory.set(0xff, keyCode);
        }

        this.events.dispatch("keyPressed", event);
      });
    }

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
   * Partial initialization for assembler-only functionality
   * This allows using the controller for assembling without display/gamepad widgets
   */
  public initPartial(options: {
    memory: Memory;
    simulator?: Simulator;
    assembler?: Assembler;
    labels?: Labels;
  }): void {
    console.log(
      "GameConsoleController: Partial initialization (assembler-only)"
    );

    // Set up memory and other components
    this._memory = options.memory;
    this._simulator = options.simulator || null;
    this._assembler = options.assembler || null;
    this._labels = options.labels || null;

    if (!this._memory) {
      throw new Error("Memory is required for partial initialization");
    }

    // Setup event listeners for simulator, assembler, and labels if available
    this.setupEventListeners();

    console.log("GameConsoleController: Partial initialization complete");
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
    gameConsoleInputService.registerKeyMappings(mappings);
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
    // Update gamepad widget if available
    if (this.gamepadWidget) {
      this.gamepadWidget.press(key);
    } else {
      // Use input service to handle key press
      const keyInfo = gameConsoleInputService.processGamepadKeyPress(
        key,
        this._memory
      );
      if (keyInfo) {
        this.events.dispatch("keyPressed", keyInfo);
      }
    }
  }

  /**
   * Map a keyboard key code to a gamepad button
   * @param keyCode Physical key code
   * @returns Corresponding gamepad key if mapped, undefined otherwise
   */
  public mapKeyToGamepad(keyCode: number): GamepadKey | undefined {
    return gameConsoleInputService.mapKeyToGamepad(keyCode);
  }

  /**
   * Handle a keyboard key press event
   * @param keyCode Key code from the keyboard event
   * @returns True if the key was handled, false otherwise
   */
  public handleKeyPress(keyCode: number): boolean {
    const keyInfo = gameConsoleInputService.handleKeyPress(
      keyCode,
      this._memory
    );
    if (keyInfo) {
      this.events.dispatch("keyPressed", keyInfo);
      return true;
    }

    return false;
  }

  /**
   * Enable or disable gamepad input processing
   * @param enabled Whether input should be processed
   */
  public setInputEnabled(enabled: boolean): void {
    gameConsoleInputService.inputEnabled = enabled;
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
    return gameConsoleStateService.colorPalette;
  }

  /**
   * Set a new color palette
   */
  set palette(value: string[]) {
    gameConsoleStateService.colorPalette = value;
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

    return gameConsoleStateService.getColorForAddress(this._memory, addr);
  }

  /**
   * Convert a memory address to pixel coordinates
   * @param addr Memory address (0x200-0x5ff)
   * @param numX Number of pixels in x direction
   * @returns [x, y] coordinates
   */
  public addrToCoordinates(addr: number, numX: number): [number, number] {
    return gameConsoleStateService.addrToCoordinates(addr, numX);
  }

  /**
   * Check if an address is in the display memory range
   * @param addr Memory address to check
   * @returns True if address is in display range (0x200-0x5ff)
   */
  public isDisplayAddress(addr: number): boolean {
    return gameConsoleStateService.isDisplayAddress(addr);
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
   * Handle gamepad key press - compatibility method for existing implementations
   * @param key Key that was pressed
   */
  public gamepadPress(key: GamepadKey): void {
    this.pressKey(key);
  }

  /**
   * Clean up resources when closing
   */
  public close(): void {
    // Stop the simulator if running
    this.stop();

    // Clear input state
    gameConsoleInputService.clearInputState(this._memory);

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

    gameConsoleStateService.initializeMemoryWithTestPattern(
      this._memory,
      pattern
    );

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
}

export const gameConsoleController = new GameConsoleController();
