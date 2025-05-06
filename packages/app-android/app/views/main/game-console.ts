import { EventData, Page, GridLayout } from "@nativescript/core";
import {
  Memory,
  Labels,
  Simulator,
  Assembler,
  SimulatorState,
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

// Import child widgets
import {
  Display,
  GamePad,
  GamePadPressEventData,
  GamePadKey,
  gamepadPressedEvent as gamePadPressedEventName,
} from "~/widgets/game-console";

// Re-export event names and interfaces for consumers of this view/controller
// export * from "~/widgets/game-console/game-console"; // Assuming event defs were there, will move if needed

class GameConsoleController {
  private page: Page | null = null;
  private _display: Display | null = null;
  private _gamePad: GamePad | null = null;

  private _memory: Memory;
  private _labels: Labels;
  private _simulator: Simulator;
  private _assembler: Assembler;

  constructor() {
    this._memory = new Memory();
    this._labels = new Labels();
    this._simulator = new Simulator(this._memory, this._labels);
    this._assembler = new Assembler(this._memory, this._labels);

    // Bind methods
    this.onLoaded = this.onLoaded.bind(this);
    this.onUnloaded = this.onUnloaded.bind(this);
    this.assemble = this.assemble.bind(this);
    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.reset = this.reset.bind(this);
    this.step = this.step.bind(this);
    this.goto = this.goto.bind(this);
    this.gamepadPress = this.gamepadPress.bind(this);
    this.close = this.close.bind(this);
  }

  // --- Public Properties (Read-only access) ---
  get memory(): Memory {
    return this._memory;
  }

  get labels(): Labels {
    return this._labels;
  }

  get simulator(): Simulator {
    return this._simulator;
  }

  get assembler(): Assembler {
    return this._assembler;
  }

  get state(): SimulatorState {
    return this._simulator.state;
  }

  // --- Lifecycle Handlers ---
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;
    console.log("game-console.view: onLoaded");
    this._display = this.page.getViewById<Display>("display");
    this._gamePad = this.page.getViewById<GamePad>("gamePad");
    this.initialize();
  }

  public onUnloaded(args: EventData): void {
    console.log("game-console.view: onUnloaded");
    this.close(); // Clean up simulator and listeners
    this.page = null;
    this._display = null;
    this._gamePad = null;
  }

  // --- Public Methods (API for external interaction) ---
  public assemble(code: string): void {
    this._simulator.reset();
    this._labels.reset();
    this._assembler.assembleCode(code);
  }

  public run(): void {
    this._simulator.stopStepper();
    this._simulator.runBinary();
  }

  public stop(): void {
    this._simulator.stop();
  }

  public reset(): void {
    this._simulator.reset();
    this._labels.reset();
    // Potentially reset display/gamepad state if needed
  }

  public step(): void {
    this._simulator.debugExecStep();
  }

  public goto(address: string): void {
    this._simulator.gotoAddr(address);
  }

  public gamepadPress(buttonName: GamePadKey): void {
    this._gamePad?.press(buttonName);
  }

  /** Call this when the view is about to be destroyed. */
  public close(): void {
    this.stop();
    this.removeEventListeners();
  }

  // --- Private Methods ---
  /**
   * Initializes the simulator and sets up event listeners.
   */
  private initialize(): void {
    this._display?.initialize(/* this._memory */); // Pass memory later
    this._simulator.reset();
    this.setupEventListeners();
    console.log("game-console.view: Initialized");
  }

  /**
   * Sets up event listeners for internal components (Simulator, Assembler, GamePad).
   */
  private setupEventListeners(): void {
    console.log("game-console.view: Setting up event listeners");
    // Remove existing listeners first to prevent duplicates on HMR
    this.removeEventListeners();

    // --- Assembler Events ---
    this._assembler.on("assemble-success", this.handleAssembleSuccess);
    this._assembler.on("assemble-failure", this.handleAssembleFailure);
    this._assembler.on("hexdump", this.handleHexdump);
    this._assembler.on("disassembly", this.handleDisassembly);
    this._assembler.on("assemble-info", this.handleAssembleInfo);

    // --- Simulator Events ---
    this._simulator.on("stop", this.handleSimulatorStop);
    this._simulator.on("start", this.handleSimulatorStart);
    this._simulator.on("reset", this.handleSimulatorReset);
    this._simulator.on("step", this.handleSimulatorStep);
    this._simulator.on("multistep", this.handleSimulatorMultiStep);
    this._simulator.on("goto", this.handleSimulatorGoto);
    this._simulator.on("pseudo-op", this.handleSimulatorPseudoOp);
    this._simulator.on("simulator-info", this.handleSimulatorInfo);
    this._simulator.on("simulator-failure", this.handleSimulatorFailure);

    // --- Labels Events ---
    this._labels.on("labels-info", this.handleLabelsInfo);
    this._labels.on("labels-failure", this.handleLabelsFailure);

    // --- GamePad Events ---
    if (this._gamePad) {
      this._gamePad.on(gamePadPressedEventName, this.handleGamepadPress);
    }
  }

  /**
   * Removes event listeners previously set up.
   */
  private removeEventListeners(): void {
    console.log("game-console.view: Removing event listeners");
    // --- Assembler Events ---
    this._assembler.off("assemble-success", this.handleAssembleSuccess);
    this._assembler.off("assemble-failure", this.handleAssembleFailure);
    this._assembler.off("hexdump", this.handleHexdump);
    this._assembler.off("disassembly", this.handleDisassembly);
    this._assembler.off("assemble-info", this.handleAssembleInfo);

    // --- Simulator Events ---
    this._simulator.off("stop", this.handleSimulatorStop);
    this._simulator.off("start", this.handleSimulatorStart);
    this._simulator.off("reset", this.handleSimulatorReset);
    this._simulator.off("step", this.handleSimulatorStep);
    this._simulator.off("multistep", this.handleSimulatorMultiStep);
    this._simulator.off("goto", this.handleSimulatorGoto);
    this._simulator.off("pseudo-op", this.handleSimulatorPseudoOp);
    this._simulator.off("simulator-info", this.handleSimulatorInfo);
    this._simulator.off("simulator-failure", this.handleSimulatorFailure);

    // --- Labels Events ---
    this._labels.off("labels-info", this.handleLabelsInfo);
    this._labels.off("labels-failure", this.handleLabelsFailure);

    // --- GamePad Events ---
    if (this._gamePad) {
      this._gamePad.off(gamePadPressedEventName, this.handleGamepadPress);
    }
  }

  // --- Event Handler Methods (Bound in constructor or use arrow functions) ---
  private handleAssembleSuccess = (event: AssemblerSuccessEvent): void => {
    this._memory.set(this._assembler.getCurrentPC(), 0x00); // Set null byte
    this.notifyParent(assembleSuccessEvent, event);
  };

  private handleAssembleFailure = (event: AssemblerFailureEvent): void => {
    this.notifyParent(assembleFailureEvent, event);
  };

  private handleHexdump = (event: AssemblerHexdumpEvent): void => {
    this.notifyParent(hexdumpEvent, event);
  };

  private handleDisassembly = (event: AssemblerDisassemblyEvent): void => {
    this.notifyParent(disassemblyEvent, event);
  };

  private handleAssembleInfo = (event: AssemblerInfoEvent): void => {
    this.notifyParent(assembleInfoEvent, event);
  };

  private handleSimulatorStop = (event: SimulatorStopEvent): void => {
    this.notifyParent(stopEvent, event);
    // Maybe update UI state here
  };

  private handleSimulatorStart = (event: SimulatorStartEvent): void => {
    this.notifyParent(startEvent, event);
    // Maybe update UI state here
  };

  private handleSimulatorReset = (event: SimulatorResetEvent): void => {
    this.notifyParent(resetEvent, event);
    // Maybe update UI state here
  };

  private handleSimulatorStep = (event: SimulatorStepEvent): void => {
    this.notifyParent(stepEvent, event);
    // Maybe update UI (debugger?) state here
  };

  private handleSimulatorMultiStep = (event: SimulatorMultiStepEvent): void => {
    this.notifyParent(multistepEvent, event);
    // Maybe update UI (debugger?) state here
  };

  private handleSimulatorGoto = (event: SimulatorGotoEvent): void => {
    this.notifyParent(gotoEvent, event);
  };

  private handleSimulatorPseudoOp = (event: SimulatorPseudoOpEvent): void => {
    this.notifyParent(pseudoOpEvent, event);
    // Handle specific pseudo ops, e.g., update display
  };

  private handleSimulatorInfo = (event: SimulatorInfoEvent): void => {
    this.notifyParent(simulatorInfoEvent, event);
  };

  private handleSimulatorFailure = (event: SimulatorFailureEvent): void => {
    this.notifyParent(simulatorFailureEvent, event);
  };

  private handleLabelsInfo = (event: LabelsInfoEvent): void => {
    this.notifyParent(labelsInfoEvent, event);
  };

  private handleLabelsFailure = (event: LabelsFailureEvent): void => {
    this.notifyParent(labelsFailureEvent, event);
  };

  private handleGamepadPress = (data: GamePadPressEventData): void => {
    console.log(`game-console.view: Gamepad key ${data.keyName} pressed`);
    this._memory.storeKeypress(data.key);
    // Forward the event if needed by parent view
    this.notifyParent(gamepadPressedEvent, data);
  };

  // Helper to notify parent component/view
  private notifyParent(eventName: string, detail: any): void {
    if (this.page) {
      this.page.notify({
        eventName: eventName,
        object: this.page, // Or maybe 'this' controller?
        detail: detail,
      });
    } else {
      console.warn(
        `game-console.view: Cannot notify parent, page is null for event: ${eventName}`
      );
    }
  }
}

// Create singleton instance of the controller
const gameConsoleController = new GameConsoleController();

// Export bound public methods for XML binding
export const onLoaded = gameConsoleController.onLoaded;
export const onUnloaded = gameConsoleController.onUnloaded;

// You might expose other methods needed directly from XML if necessary,
// but typically interaction goes through the main page's controller.

// --- Re-export event names --- Need to define them here now
export const assembleSuccessEvent = "assemble-success";
export const assembleFailureEvent = "assemble-failure";
export const hexdumpEvent = "hexdump";
export const disassemblyEvent = "disassembly";
export const assembleInfoEvent = "assemble-info";
export const stopEvent = "stop";
export const startEvent = "start";
export const resetEvent = "reset";
export const stepEvent = "step";
export const multistepEvent = "multistep";
export const gotoEvent = "goto";
export const pseudoOpEvent = "pseudo-op";
export const simulatorInfoEvent = "simulator-info";
export const simulatorFailureEvent = "simulator-failure";
export const labelsInfoEvent = "labels-info";
export const labelsFailureEvent = "labels-failure";
export const gamepadPressedEvent = "gamepad-pressed";
