import {
  Page,
  ScrollView,
  ScrollEventData,
  Utils,
  Frame,
  Application,
} from "@nativescript/core";

import { EventData } from "@nativescript/core";
import { systemStates, SystemStates } from "~/states";

// Import common interfaces and types
import {
  MainView,
  ViewType,
  gameConsoleController,
  learnController,
  debuggerController,
  mainStateController,
  editorController,
} from "@learn6502/common-ui";
import { SimulatorState } from "@learn6502/6502";
import type { GamepadKey } from "@learn6502/common-ui";

// Import services
import { notificationService } from "~/services";
import { SystemAppearanceChangeEvent } from "~/types";
import { MainButton } from "~/widgets";
import { MainButtonState } from "@learn6502/common-ui";
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
  private actionBar: any | null = null;
  private mainButton: MainButton | null = null;
  private bottomNavigation: BottomNavigation | null = null;
  private mainFrame: Frame | null = null;

  // Current active view
  private _activeView: ViewType = ViewType.EDITOR;

  /**
   * Get the current simulator state
   */
  get state(): SimulatorState {
    return gameConsoleView.simulator.state;
  }

  /**
   * Get the current active view
   */
  get activeView(): ViewType {
    return this._activeView;
  }

  constructor() {
    // Private constructor for singleton pattern
    DEV_LOG && console.log("[MainController] Initialized");
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
      DEV_LOG && console.log("[MainController] Gamepad key pressed:", event.key, event.keyCode);
      // Add any additional UI feedback or logging here
    });
  }

  /**
   * Sets up game console signal listeners for debugger integration
   */
  private setupGameConsoleSignalListeners(): void {
    DEV_LOG && console.log("[MainController] Setting up game console signal listeners");

    // Listen for assemble success to update debugger
    gameConsoleController.on("assemble-success", (signal) => {
      DEV_LOG && console.log("[MainController] assemble-success event received:", signal);
      if (signal.message) {
        debuggerController.log(signal.message);
      }

      // Update debugger with assembled code
      if (signal.assembler) {
        debuggerView.updateHexdump(signal.assembler);
        debuggerView.updateDisassembled(signal.assembler);
      }

      // Update UI state
      this.updateMainUiState();

      notificationService.showNotification({
        title: "Assembled successfully",
        timeout: 2,
      });
    });

    gameConsoleController.on("assemble-failure", (signal) => {
      DEV_LOG && console.log("[MainController] assemble-failure event received:", signal);
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
      this.updateMainUiState();
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("start", (signal) => {
      this.updateMainUiState();
      if (signal.message) {
        debuggerController.log(signal.message);
      }
    });

    gameConsoleController.on("reset", (signal) => {
      this.updateMainUiState();
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

  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    // Note: Status bar and navigation bar icon colors are automatically handled by
    // NativeScript's setDarkModeHandler in app.ts, which reacts to theme changes.
    // No manual intervention needed here.
  }

  /**
   * Sets up learn tutorial signal listeners
   */
  private setupLearnTutorialSignalListeners(): void {
    learnController.on("copy", ({ code }: { code: string }) => {
      this.setEditorCode(code);
      // Show notification using notification service
      notificationService.showNotification({
        title: "Code copied to editor",
        timeout: 2,
      });
      DEV_LOG && console.log("[MainController] Learn: Code copied to editor", code);
    });
  }

  /**
   * Sets up main state event listeners for platform-independent control
   */
  private setupMainStateEventListeners(): void {
    // Listen for state changes
    mainStateController.events.on("state-changed", (state) => {
      DEV_LOG && console.log("[MainController] Main state changed:", state);
      this.updateMainUiState();
    });

    // Listen for code changed events
    mainStateController.events.on("state-changed:code-changed", (changed) => {
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
    // Listen for editor text changes via the controller
    editorController.events.on("changed", () => {
      mainStateController.setCodeChanged(true);
    });
  }

  /**
   * Event handler for the 'loaded' event of the root view.
   * @param args Event arguments containing the view object.
   */
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    // Handle androidOverflowInset event for edge-to-edge
    // NativeScript automatically sets up the inset listener when this event is registered
    // See: references/nativescript/nativescript/packages/core/ui/core/view/index.android.ts:527-580
    // See: https://docs.nativescript.org/ui/page#android-edge-to-edge-tip
    this.page.on("androidOverflowInset", (insetArgs: any) => {
      const { inset } = insetArgs;
      const { appVariables } = require("~/variables");

      // Store insets in appVariables (as CSS variables)
      // Pattern from reference projects (conty, oss-weather, alpimaps)
      appVariables.setWindowInset({
        top: inset.top || 0,
        bottom: inset.bottom || 0,
        left: inset.left || 0,
        right: inset.right || 0,
        keyboard: 0, // Keyboard insets are handled separately via IME insets
      });

      // Consume all insets so they don't propagate to child views
      // Individual views can use CSS variables (--windowInsetTop, etc.) to apply padding as needed
      inset.topConsumed = true;
      inset.bottomConsumed = true;
      inset.leftConsumed = true;
      inset.rightConsumed = true;

      DEV_LOG && console.log("[MainController] Android overflow insets handled", {
        top: inset.top,
        bottom: inset.bottom,
        left: inset.left,
        right: inset.right,
      });
    });

    // Find UI elements
    this.actionBar = this.page.getViewById("main-action-bar");
    this.mainButton = this.page.getViewById<MainButton>("mainButton");
    this.bottomNavigation =
      this.page.getViewById<BottomNavigation>("bottomNavigation");
    this.mainFrame = this.page.getViewById<Frame>("mainFrame");

    // Debug: Check if bottomNavigation was found
    if (this.bottomNavigation) {
      DEV_LOG && console.log("[MainController] BottomNavigation found");
      try {
        const height = this.bottomNavigation.height;
        const visibility = this.bottomNavigation.visibility;
        DEV_LOG && console.log(
          `[MainController] BottomNavigation - height: ${height}, visibility: ${visibility}`
        );
      } catch (error) {
        console.error("[MainController] Error checking BottomNavigation properties:", error);
      }
    } else {
      console.error("[MainController] BottomNavigation NOT FOUND!");
    }

    // Set up system event listeners
    systemStates.events.on(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
    this.onSystemAppearanceChanged({
      newValue: systemStates.systemAppearance,
      oldValue: null,
      initial: true,
    });

    // Initialize services and controllers
    this.setupAndroidKeyHandling();
    this.setupLearnTutorialSignalListeners();
    this.initializeGameConsoleController();
    this.setupGameConsoleSignalListeners();
    this.setupMainStateEventListeners();
    this.setupEditorEventListeners();
    mainStateController.init();

    // Set up main button and scroll behavior
    this.setupMainButton();
    this.initFabScrollBehavior();

    // Navigate to initial view
    this.navigateToView(this.activeView);
  }

  /**
   * Event handler for the 'unloaded' event of the root view.
   * Cleans up event listeners.
   * @param args Event arguments containing the view object.
   */
  public onUnloaded(args: EventData): void {
    const view = args.object as Page;
    DEV_LOG && console.log("[MainController] unloaded:", view.id);

    // Unsubscribe appearance change handler
    systemStates.events.off(
      SystemStates.systemAppearanceChangedEvent,
      this.onSystemAppearanceChanged
    );
  }

  public initFabScrollBehavior(): void {
    if (!this.page || !this.mainButton) {
      return;
    }

    const scrollView = this.page.getViewById<ScrollView>("mainScrollView");
    if (!scrollView) {
      return;
    }

    let lastScrollY = 0;
    const scrollThreshold = 15; // Higher threshold to prevent flickering
    let isExtendedByScroll = false;

    scrollView.on(ScrollView.scrollEvent, (event: ScrollEventData) => {
      const currentScrollY = event.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Don't interfere with FAB behavior if it's hidden by state
      if (this.mainButton.getState() === MainButtonState.HIDDEN) {
        lastScrollY = currentScrollY;
        return;
      }

      // Calculate scroll position as percentage (0 = top, 1 = bottom)
      const scrollableHeight = scrollView.scrollableHeight;
      const scrollPercentage =
        scrollableHeight > 0 ? currentScrollY / scrollableHeight : 0;

      // Material Design 3 Extended FAB behavior:
      // - At top (scrollPercentage < 0.1): Extended FAB
      // - In middle (0.1 <= scrollPercentage <= 0.9): Normal FAB
      // - At bottom (scrollPercentage > 0.9): Extended FAB

      const shouldBeExtended = scrollPercentage < 0.1 || scrollPercentage > 0.9;

      if (shouldBeExtended && !isExtendedByScroll) {
        // Extend the FAB at top/bottom positions
        this.mainButton.extend();
        isExtendedByScroll = true;
      } else if (!shouldBeExtended && isExtendedByScroll) {
        // Shrink the FAB in middle positions
        this.mainButton.shrink();
        isExtendedByScroll = false;
      }

      // Update last scroll position only if significant movement occurred
      if (Math.abs(scrollDiff) > scrollThreshold) {
        lastScrollY = currentScrollY;
      }
    });
  }

  /**
   * Navigates to a specific view/tab
   * @param viewType The view to navigate to
   */
  public navigateToView(viewType: ViewType): void {
    if (!this.mainFrame || !this.bottomNavigation) {
      return;
    }

    // Update active view
    this._activeView = viewType;
    mainStateController.setViewType(viewType);

    // Navigate the frame to the new view
    const moduleName = this.getModuleNameForViewType(viewType);
    if (moduleName) {
      this.mainFrame.navigate({
        moduleName: moduleName,
        clearHistory: true,
        transition: {
          name: "fade",
          duration: 200,
        },
      });
    }

    // Update the bottom navigation
    this.bottomNavigation.selectTab(viewType);
  }

  /**
   * Gets the module name for a given view type
   * @param viewType The view type to get module name for
   * @returns The module name or null if not found
   */
  private getModuleNameForViewType(viewType: ViewType): string | null {
    const moduleMap = {
      [ViewType.LEARN]: "views/main/learn",
      [ViewType.EDITOR]: "views/main/editor",
      [ViewType.DEBUGGER]: "views/main/debugger",
      [ViewType.GAME_CONSOLE]: "views/main/game-console",
      [ViewType.STORYBOOK]: "views/main/storybook",
    };

    return moduleMap[viewType] || null;
  }

  /**
   * Implementation of MainView methods
   */

  /**
   * Assembles the code in the editor
   */
  public assembleGameConsole(): void {
    DEV_LOG && console.log("[MainController] assembleGameConsole");

    // Navigate to the debugger tab
    this.navigateToView(ViewType.DEBUGGER);

    // Get code from editor controller and assemble it
    const code = editorController.code;
    DEV_LOG && console.log("[MainController] Code to assemble:", code);

    // Reset the code changed flag BEFORE assembling using mainStateController
    mainStateController.setCodeChanged(false);

    // Assemble the code
    DEV_LOG && console.log("[MainController] Calling gameConsoleController.assemble...");
    gameConsoleController.assemble(code);
    DEV_LOG && console.log("[MainController] gameConsoleController.assemble called");
  }

  /**
   * Runs the assembled code
   */
  public runGameConsole(): void {
    DEV_LOG && console.log("[MainController] runGameConsole");

    // Navigate to the game console tab
    this.navigateToView(ViewType.GAME_CONSOLE);

    // Start the simulator
    gameConsoleView.run();
  }

  /**
   * Pauses the running code
   */
  public pauseGameConsole(): void {
    DEV_LOG && console.log("[MainController] pauseGameConsole");

    // Pause the simulator
    gameConsoleView.stop();
  }

  /**
   * Resets the simulator
   */
  public reset(): void {
    DEV_LOG && console.log("[MainController] reset");

    // Reset debugger
    debuggerView.reset();

    // Reset the simulator
    gameConsoleView.reset();
  }

  /**
   * Executes a single step of the program
   */
  public stepGameConsole(): void {
    DEV_LOG && console.log("[MainController] stepGameConsole");

    // Navigate to the debugger tab
    this.navigateToView(ViewType.DEBUGGER);

    // Enable stepper if not already enabled
    if (!gameConsoleView.simulator.stepperEnabled) {
      gameConsoleView.simulator.enableStepper();
    }

    // Execute a single step
    gameConsoleView.simulator.debugExecStep();

    // Update the UI
    this.updateMainUiState();
  }

  /**
   * Sets the code in the editor
   * @param code The code to set
   */
  public setEditorCode(code: string): void {
    DEV_LOG && console.log("[MainController] setEditorCode", code);

    // Navigate to the editor tab
    this.navigateToView(ViewType.EDITOR);

    // Set the code in the editor via controller
    editorController.setCode(code);

    // Reset code changed flag using mainStateController
    mainStateController.setCodeChanged(false);
  }

  /**
   * Updates the main button state based on the current simulator state
   */
  private updateMainUiState(): void {
    if (this.mainButton) {
      // Update button enabled states
      const hasCode = editorController.hasCode;
      const codeChanged = mainStateController.getCodeChanged();
      const currentState = this.state;

      const enabledState = mainStateController.getActionEnabledState(
        currentState,
        hasCode,
        codeChanged
      );

      // Apply enabled states to button actions
      this.mainButton.setActionEnabledStates(enabledState);

      // Update the button state based on simulator state and current view - this is the key part!
      this.mainButton.updateFromSimulatorState(currentState);
    }
  }

  /**
   * Button event handlers
   */
  public openMenu(): void {
    DEV_LOG && console.log("[MainController] openMenu");
    // TODO: Implement menu functionality
  }

  public onAssembleTap(): void {
    DEV_LOG && console.log("[MainController] onAssembleTap");
    mainStateController.emitAssemble();
  }

  public onRunTap(): void {
    DEV_LOG && console.log("[MainController] onRunTap");
    mainStateController.emitRun();
  }

  public onPauseTap(): void {
    DEV_LOG && console.log("[MainController] onPauseTap");
    mainStateController.emitPause();
  }

  public onResumeTap(): void {
    DEV_LOG && console.log("[MainController] onResumeTap");
    mainStateController.emitResume();
  }

  public onResetTap(): void {
    DEV_LOG && console.log("[MainController] onResetTap");
    mainStateController.emitReset();
  }

  public onStepTap(): void {
    DEV_LOG && console.log("[MainController] onStepTap");
    mainStateController.emitStep();
  }

  /**
   * Sets up the main button with initial state
   */
  private setupMainButton(): void {
    if (!this.mainButton) {
      return;
    }

    // Update UI state first to get the correct initial state
    this.updateMainUiState();

    // Handle initial visibility based on state
    const currentState = this.mainButton.getState();
    if (currentState === MainButtonState.HIDDEN) {
      // Ensure the button is completely hidden
      this.mainButton.nativeFab?.setVisibility(android.view.View.GONE);
    } else {
      // Ensure the button is visible
      this.mainButton.nativeFab?.setVisibility(android.view.View.VISIBLE);
      this.mainButton.show();
    }
  }

  /**
   * Initialize the game console controller early so it's available for assembling
   */
  private initializeGameConsoleController(): void {
    DEV_LOG && console.log("[MainController] Initializing gameConsoleController early");

    // Use partial initialization to set up assembler functionality without widgets
    gameConsoleController.initPartial({
      memory: gameConsoleView.memory,
      simulator: gameConsoleView.simulator,
      assembler: gameConsoleView.assembler,
      labels: gameConsoleView.labels,
    });

    DEV_LOG && console.log("[MainController] gameConsoleController partial initialization complete");
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
