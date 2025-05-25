import {
  Page,
  ScrollView,
  ScrollEventData,
  Utils,
  ActionBar,
  Frame,
  Application,
} from "@nativescript/core";

import { EventData } from "@nativescript/core";
import { systemStates, SystemStates } from "~/states";
import { setStatusBarAppearance } from "~/utils/system";

// Import common interfaces and types
import {
  MainView,
  ViewType,
  gameConsoleController,
  learnController,
  debuggerController,
  mainStateController,
} from "@learn6502/common-ui";
import { SimulatorState } from "@learn6502/6502";
import type { GamepadKey } from "@learn6502/common-ui";

// Import services
import { notificationService } from "~/services";

// Import WindowInsetsCompat
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import { SystemAppearanceChangeEvent, WindowInsetsChangeEvent } from "~/types";
import { MainButton } from "~/widgets";
import { BottomNavigation } from "~/widgets/bottom-navigation";

// Import debugger view
import { debuggerView } from "./main/debugger";

// Import editor view
import { editorView } from "./main/editor";

// Import game console view
import { gameConsoleView } from "./main/game-console";

/**
 * MainController class to handle all main page functionality
 * Implements MainView from common-ui
 */
export class MainController implements MainView {
  private page: Page | null = null;
  private actionBar: ActionBar | null = null;
  private mainButton: MainButton | null = null;
  private bottomNavigation: BottomNavigation | null = null;
  private mainFrame: Frame | null = null;

  // Current simulator state
  private _state: SimulatorState = SimulatorState.READY;

  // Current active view
  private _activeView: ViewType = ViewType.LEARN;

  // Track if code has changed
  private _codeChanged: boolean = false;

  /**
   * Get the current simulator state
   */
  get state(): SimulatorState {
    return this._state;
  }

  /**
   * Get the current active view
   */
  get activeView(): ViewType {
    return this._activeView;
  }

  constructor() {
    // Private constructor for singleton pattern
    console.log("MainController: initialized");
    this.handleWindowInsets = this.handleWindowInsets.bind(this);
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
    this.setupAndroidKeyHandling = this.setupAndroidKeyHandling.bind(this);
    this.setupLearnTutorialSignalListeners =
      this.setupLearnTutorialSignalListeners.bind(this);
    this.setupGameConsoleSignalListeners =
      this.setupGameConsoleSignalListeners.bind(this);
    this.setupMainStateEventListeners =
      this.setupMainStateEventListeners.bind(this);
    this.setupEditorEventListeners = this.setupEditorEventListeners.bind(this);
  }

  /**
   * Sets up Android key handling and registers key mappings
   */
  private setupAndroidKeyHandling(): void {
    // Android key codes
    const KEY_UP = 19; // KEYCODE_DPAD_UP
    const KEY_DOWN = 20; // KEYCODE_DPAD_DOWN
    const KEY_LEFT = 21; // KEYCODE_DPAD_LEFT
    const KEY_RIGHT = 22; // KEYCODE_DPAD_RIGHT
    const KEY_ENTER = 66; // KEYCODE_ENTER
    const KEY_SPACE = 62; // KEYCODE_SPACE

    // Register Android-specific key mappings
    gameConsoleController.registerKeyMappings({
      [KEY_UP]: "Up",
      [KEY_DOWN]: "Down",
      [KEY_LEFT]: "Left",
      [KEY_RIGHT]: "Right",
      [KEY_ENTER]: "A",
      [KEY_SPACE]: "B",
    });

    // Set up global key handler if possible
    if (Application.android) {
      try {
        const activity = Application.android.foregroundActivity;
        if (activity) {
          activity.onKeyDown = function (keyCode: number, event: any) {
            if (gameConsoleController.handleKeyPress(keyCode)) {
              return true;
            }
            // Let native Android handle other keys
            return false;
          };
        }
      } catch (error) {
        console.error("Error setting up key handling:", error);
      }
    }

    // Set up game console service event listener
    gameConsoleController.on("keyPressed", (event) => {
      console.log("Gamepad key pressed:", event.key, event.keyCode);
      // Add any additional UI feedback or logging here
    });
  }

  /**
   * Sets up game console signal listeners for debugger integration
   */
  private setupGameConsoleSignalListeners(): void {
    // Listen for assemble success to update debugger
    gameConsoleController.on("assemble-success", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      // Update debugger with assembled code
      if (signal.assembler) {
        debuggerView.updateHexdump(signal.assembler);
        debuggerView.updateDisassembled(signal.assembler);
      }

      // Note: SimulatorState update should come from simulator events, not assembler events
      notificationService.showNotification({
        title: "Assembled successfully",
        timeout: 2,
      });
    });

    gameConsoleController.on("assemble-failure", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      notificationService.showNotification({
        title: "Assemble failed",
        timeout: 2,
      });
    });

    gameConsoleController.on("hexdump", (signal) => {
      if (signal.message) {
        debuggerController.log("Hexdump:\n" + signal.message);
      }
    });

    gameConsoleController.on("disassembly", (signal) => {
      if (signal.message) {
        debuggerController.log("Disassembly:\n" + signal.message);
      }
    });

    gameConsoleController.on("assemble-info", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("stop", (signal) => {
      this.onSimulatorStateChange(signal.state);
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("start", (signal) => {
      this.onSimulatorStateChange(signal.state);
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("reset", (signal) => {
      this.onSimulatorStateChange(signal.state);
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("step", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      // Update debugger with current state from simulator
      if (signal.simulator) {
        // We need to get memory from the simulator or game console controller
        // For now, we'll update debug info only
        debuggerView.updateDebugInfo(signal.simulator);
      }
    });

    gameConsoleController.on("multistep", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      // Update debugger with current state from simulator
      if (signal.simulator) {
        // We need to get memory from the simulator or game console controller
        // For now, we'll update debug info only
        debuggerView.updateDebugInfo(signal.simulator);
      }
    });

    gameConsoleController.on("goto", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      // Update debugger with current state from simulator
      if (signal.simulator) {
        // We need to get memory from the simulator or game console controller
        // For now, we'll update debug info only
        debuggerView.updateDebugInfo(signal.simulator);
      }
    });

    gameConsoleController.on("simulator-info", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("simulator-failure", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      notificationService.showNotification({
        title: "Simulator failure",
        timeout: 2,
      });
    });

    gameConsoleController.on("labels-info", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("labels-failure", (signal) => {
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      notificationService.showNotification({
        title: "Labels failure",
        timeout: 2,
      });
    });
  }

  /**
   * Handles window inset changes to apply top margin dynamically.
   * @param insets The WindowInsetsCompat object containing inset data.
   */
  private handleWindowInsets(event: WindowInsetsChangeEvent): void {
    if (!event.newValue || !this.actionBar) {
      // Check if content exists and is a View
      console.warn(
        `main: handleWindowInsets - Could not apply padding. Insets: ${!!event.newValue}, ActionBar: ${this.actionBar}`
      );
      return;
    }

    const topInsetPixels = event.newValue.getInsets(
      androidx_core_view_WindowInsetsCompat.Type.systemBars()
    ).top;
    const topPaddingDips =
      Utils.layout.toDeviceIndependentPixels(topInsetPixels);
    // Apply marginTop to the ActionBar
    this.actionBar.style.marginTop = topPaddingDips;

    console.log(
      `main: handleWindowInsets - Applied marginTop: ${topPaddingDips} DIPs to ActionBar (from ${topInsetPixels}px)`
    );
  }

  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    setStatusBarAppearance("surface", event.newValue === "dark");
  }

  /**
   * Sets up learn tutorial signal listeners
   */
  private setupLearnTutorialSignalListeners(): void {
    learnController.on("copy", ({ code }) => {
      this.setEditorCode(code);
      // Show notification using notification service
      notificationService.showNotification({
        title: "Code copied to editor",
        timeout: 2,
      });
      console.log("Learn: Code copied to editor", code);
    });
  }

  /**
   * Sets up main state event listeners for platform-independent control
   */
  private setupMainStateEventListeners(): void {
    // Listen for state changes
    mainStateController.events.on("state-changed", (state) => {
      console.log("Main state changed:", state);
      this.updateMainUiState();
    });

    // Listen for code changed events
    mainStateController.events.on("code-changed", (changed) => {
      this._codeChanged = changed;
      this.updateMainUiState();
    });

    // Listen for action events
    mainStateController.events.on("assemble", () => {
      this.assembleGameConsole();
    });

    mainStateController.events.on("run", () => {
      this.runGameConsole();
    });

    mainStateController.events.on("pause", () => {
      this.pauseGameConsole();
    });

    mainStateController.events.on("resume", () => {
      this.runGameConsole();
    });

    mainStateController.events.on("reset", () => {
      this.reset();
    });

    mainStateController.events.on("step", () => {
      this.stepGameConsole();
    });

    mainStateController.events.on("navigate-to-view", ({ viewType }) => {
      this.navigateToView(viewType as ViewType);
    });
  }

  /**
   * Sets up editor event listeners
   */
  private setupEditorEventListeners(): void {
    // Listen for editor text changes
    editorView.events.on("changed", () => {
      mainStateController.setCodeChanged(true);
    });
  }

  /**
   * Event handler for the 'loaded' event of the root view.
   * Applies system bar insets to ensure content is not drawn under system bars
   * when Edge-to-Edge is enabled.
   * @param args Event arguments containing the view object.
   */
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;
    this.actionBar = this.page.getViewById<ActionBar>("main-action-bar");
    this.mainButton = this.page.getViewById<MainButton>("mainButton");
    this.bottomNavigation =
      this.page.getViewById<BottomNavigation>("bottomNavigation");
    this.mainFrame = this.page.getViewById<Frame>("mainFrame");

    console.log("main: loaded:", this.page.id);

    systemStates.events.on(
      SystemStates.windowInsetsChangedEvent,
      this.handleWindowInsets
    );
    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    setStatusBarAppearance("surface");

    this.initFabScrollBehavior();

    // Set up Android key handling
    this.setupAndroidKeyHandling();

    // Set up Learn tutorial signal listeners
    this.setupLearnTutorialSignalListeners();

    // Set up Game Console signal listeners for debugger integration
    this.setupGameConsoleSignalListeners();

    // Set up main state event listeners
    this.setupMainStateEventListeners();

    // Set up editor event listeners
    this.setupEditorEventListeners();

    // Initialize main state controller
    mainStateController.init();
  }

  /**
   * Event handler for the 'unloaded' event of the root view.
   * Cleans up event listeners.
   * @param args Event arguments containing the view object.
   */
  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    console.log("main: unloaded:", view.id);

    // Unsubscribe if handler exists
    if (this.handleWindowInsets) {
      systemStates.events.off(
        SystemStates.windowInsetsChangedEvent,
        this.handleWindowInsets
      );
    }

    // Backward compatibility
    if (view["insetsHandler"]) {
      systemStates.events.off(
        SystemStates.windowInsetsChangedEvent,
        view["insetsHandler"]
      );
    }

    // Unsubscribe appearance change handler
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
  }

  public initFabScrollBehavior(): void {
    if (!this.page) {
      console.error("main: initFabScrollBehavior - View not found");
      return;
    }

    const scrollView = this.page?.getViewById<ScrollView>("mainScrollView");
    const mainButton = this.page?.getViewById<MainButton>("mainButton");

    if (!scrollView || !mainButton) {
      console.error(
        "ScrollView or MainButton not found for scroll behavior setup."
      );
      return;
    }

    let lastScrollY = 0;
    const scrollThreshold = 10;

    scrollView.on(ScrollView.scrollEvent, (event: ScrollEventData) => {
      const currentScrollY = event.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Scrolled to the top and FAB is collapsed, extend it
      if (currentScrollY <= 0 && !mainButton.isExtended) {
        mainButton.extend();
      }
      // Scrolled to the bottom and FAB is collapsed, extend it
      else if (
        currentScrollY >= scrollView.scrollableHeight &&
        !mainButton.isExtended
      ) {
        mainButton.extend();
      }
      // Scroll down and FAB is extended, collapse it
      else if (scrollDiff > scrollThreshold && mainButton.isExtended) {
        mainButton.collapse();
      }
      // Scroll up and FAB is extended, collapse it
      else if (scrollDiff < -scrollThreshold && mainButton.isExtended) {
        mainButton.collapse();
      }

      // Update last scroll position
      if (Math.abs(scrollDiff) > scrollThreshold || currentScrollY <= 0) {
        lastScrollY = currentScrollY;
      }
    });
  }

  /**
   * Navigates to a specific view/tab
   * @param viewType The view to navigate to
   */
  public navigateToView(viewType: ViewType): void {
    console.log("navigateToView", viewType);

    if (!this.mainFrame || !this.bottomNavigation) {
      console.error("navigateToView: MainFrame or BottomNavigation not found");
      return;
    }

    // Then update the bottom navigation
    this.bottomNavigation.selectTab(viewType);

    // Update active view
    this._activeView = viewType;
  }

  /**
   * Implementation of MainView methods
   */

  /**
   * Assembles the code in the editor
   */
  public assembleGameConsole(): void {
    console.log("assembleGameConsole");

    // Navigate to the debugger tab
    this.navigateToView(ViewType.DEBUGGER);

    // Get code from editor and assemble it
    const code = editorView.code;

    // Reset the code changed flag BEFORE assembling
    mainStateController.setCodeChanged(false);

    // Assemble the code
    gameConsoleController.assemble(code);
  }

  /**
   * Runs the assembled code
   */
  public runGameConsole(): void {
    console.log("runGameConsole");

    // Navigate to the game console tab
    this.navigateToView(ViewType.GAME_CONSOLE);

    // Start the simulator
    gameConsoleView.run();
  }

  /**
   * Pauses the running code
   */
  public pauseGameConsole(): void {
    console.log("pauseGameConsole");

    // Pause the simulator
    gameConsoleView.stop();
  }

  /**
   * Resets the simulator
   */
  public reset(): void {
    console.log("reset");

    // Reset debugger
    debuggerView.reset();

    // Reset the simulator
    gameConsoleView.reset();
  }

  /**
   * Executes a single step of the program
   */
  public stepGameConsole(): void {
    console.log("stepGameConsole");

    // Navigate to the debugger tab
    this.navigateToView(ViewType.DEBUGGER);

    // Enable stepper if not already enabled
    if (!gameConsoleView.simulator.stepperEnabled) {
      gameConsoleView.simulator.enableStepper();
    }

    // Execute a single step
    gameConsoleView.simulator.debugExecStep();

    // Update the UI
    this.onSimulatorStateChange(gameConsoleView.simulator.state);
  }

  /**
   * Sets the code in the editor
   * @param code The code to set
   */
  public setEditorCode(code: string): void {
    console.log("setEditorCode", code);

    // Navigate to the editor tab
    this.navigateToView(ViewType.EDITOR);

    // Set the code in the editor
    editorView.setCode(code);

    // Reset code changed flag
    mainStateController.setCodeChanged(false);
  }

  /**
   * Updates the main button state based on the current simulator state
   */
  private updateMainUiState(): void {
    if (this.mainButton) {
      // Get the current state from mainStateController
      const state = mainStateController.getState();
      this.mainButton.setState(state);

      // Update button enabled states
      const hasCode = editorView.hasCode;
      const enabledState = mainStateController.getActionEnabledState(
        this._state,
        hasCode,
        this._codeChanged
      );

      // Apply enabled states to button actions
      this.mainButton.setActionEnabledStates(enabledState);
    }
  }

  /**
   * Handle simulator state changes
   */
  private onSimulatorStateChange(state: SimulatorState): void {
    console.log("onSimulatorStateChange", state);
    this._state = state;
    this.updateMainUiState();
  }

  /**
   * Button event handlers
   */
  public openMenu(): void {
    console.log("openMenu");
    // TODO: Implement menu functionality
  }

  public onAssembleTap(): void {
    console.log("onAssembleTap");
    mainStateController.emitAssemble();
  }

  public onRunTap(): void {
    console.log("onRunTap");
    mainStateController.emitRun();
  }

  public onPauseTap(): void {
    console.log("onPauseTap");
    mainStateController.emitPause();
  }

  public onResumeTap(): void {
    console.log("onResumeTap");
    mainStateController.emitResume();
  }

  public onResetTap(): void {
    console.log("onResetTap");
    mainStateController.emitReset();
  }

  public onStepTap(): void {
    console.log("onStepTap");
    mainStateController.emitStep();
  }
}

// Create singleton instance
const mainController = new MainController();

// Export public functions using the instance
export const onLoaded = mainController.onLoaded.bind(mainController);
export const onUnloaded = mainController.onUnloaded.bind(mainController);
export const openMenu = mainController.openMenu.bind(mainController);
export const onAssembleTap = mainController.onAssembleTap.bind(mainController);
export const onRunTap = mainController.onRunTap.bind(mainController);
export const onPauseTap = mainController.onPauseTap.bind(mainController);
export const onResumeTap = mainController.onResumeTap.bind(mainController);
export const onResetTap = mainController.onResetTap.bind(mainController);
export const onStepTap = mainController.onStepTap.bind(mainController);
