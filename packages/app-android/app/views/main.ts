import type { Page, ScrollEventData, Frame } from "@nativescript/core";
import { ScrollView, Application } from "@nativescript/core";

import type { EventData } from "@nativescript/core";
import { systemStates, SystemStates } from "~/states";

// Import common interfaces and types
import type { MainView } from "@learn6502/common-ui";
import {
  ViewType,
  gameConsoleController,
  debuggerController,
  mainStateController,
  editorController,
  GameConsoleEventBridge,
  MainEventBridge,
  MainButtonState,
} from "@learn6502/common-ui";
import type { SimulatorState } from "@learn6502/6502";

// Import services
import { notificationService } from "~/services";
import type { SystemAppearanceChangeEvent } from "~/types";
import type { MainButton } from "~/widgets";
import { showError, logger } from "~/utils";
import type { BottomNavigation } from "~/widgets/bottom-navigation";

// Import views
import { debuggerView } from "./main/debugger";
import { gameConsoleView } from "./main/game-console";

/** Notification key to user-facing title mapping */
const NOTIFICATION_TITLES: Record<string, string> = {
  "assembled-successfully": "Assembled successfully",
  "assemble-failed": "Assemble failed",
  "simulator-failure": "Simulator failure",
  "labels-failure": "Labels failure",
  "code-copied-to-editor": "Code copied to editor",
  "program-completed": "Program completed",
};

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

  // Scoped logger for this class
  private log = logger.scoped("MainController");

  // Event bridges
  private gameConsoleBridge: GameConsoleEventBridge;
  private mainBridge: MainEventBridge;

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
    this.log.debug("Initialized");
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);

    // Initialize GameConsole event bridge
    this.gameConsoleBridge = new GameConsoleEventBridge({
      formatAndLog: (message, params) => {
        // Android: log directly without i18n formatting
        debuggerController.log(message);
      },
      updateDebugger: () => {
        // Android: update debugger view if available
        if (gameConsoleView.memory && gameConsoleView.simulator) {
          debuggerView.update(gameConsoleView.memory, gameConsoleView.simulator);
        }
      },
      updateAssemblerViews: (assembler) => {
        debuggerView.updateHexdump(assembler);
        debuggerView.updateDisassembled(assembler);
      },
      updateUiState: () => {
        this.updateMainUiState();
      },
      showNotification: (key) => {
        notificationService.showNotification({
          title: NOTIFICATION_TITLES[key] || key,
          timeout: 2,
        });
      },
      updateDebugInfo: (simulator) => {
        debuggerView.updateDebugInfo(simulator);
      },
    });

    // Initialize Main event bridge
    this.mainBridge = new MainEventBridge({
      mainView: this,
      onStateChanged: () => {
        this.updateMainUiState();
      },
      onLearnCodeCopied: (code) => {
        this.log.debug("Learn: Code copied to editor", code);
      },
      showNotification: (key) => {
        notificationService.showNotification({
          title: NOTIFICATION_TITLES[key] || key,
          timeout: 2,
        });
      },
    });
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
        // Silent error - key handling is non-critical
        showError(error, {
          silent: true,
        });
      }
    }

    // Set up game console service event listener
    gameConsoleController.on("keyPressed", (event) => {
      this.log.debug("Gamepad key pressed:", event.key, event.keyCode);
    });
  }

  private onSystemAppearanceChanged(event: SystemAppearanceChangeEvent): void {
    // Note: Status bar and navigation bar icon colors are automatically handled by
    // NativeScript's setDarkModeHandler in app.ts, which reacts to theme changes.
    // No manual intervention needed here.
  }

  /**
   * Event handler for the 'loaded' event of the root view.
   * @param args Event arguments containing the view object.
   */
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;

    // Find UI elements
    this.actionBar = this.page.getViewById("main-action-bar");
    this.mainButton = this.page.getViewById<MainButton>("mainButton");
    this.bottomNavigation = this.page.getViewById<BottomNavigation>("bottomNavigation");
    this.mainFrame = this.page.getViewById<Frame>("mainFrame");

    // Log if bottomNavigation was found
    this.log.debug(`BottomNavigation ${this.bottomNavigation ? "found" : "NOT FOUND"}`);

    // Set up system event listeners
    systemStates.events.on(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);
    this.onSystemAppearanceChanged({
      newValue: systemStates.systemAppearance,
      oldValue: null,
      initial: true,
    });

    // Initialize services and controllers
    this.setupAndroidKeyHandling();
    this.initializeGameConsoleController();

    // Connect event bridges (replaces manual event listener setup)
    this.gameConsoleBridge.connect();
    this.mainBridge.connect();

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
    this.log.debug("unloaded:", view.id);

    // Disconnect event bridges
    this.gameConsoleBridge.disconnect();
    this.mainBridge.disconnect();

    // Unsubscribe appearance change handler
    systemStates.events.off(SystemStates.systemAppearanceChangedEvent, this.onSystemAppearanceChanged);
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

    scrollView.on(ScrollView.scrollEvent, (event: EventData) => {
      const scrollEvent = event as ScrollEventData;
      const currentScrollY = scrollEvent.scrollY;
      const scrollDiff = currentScrollY - lastScrollY;

      // Don't interfere with FAB behavior if it's hidden by state
      if (this.mainButton!.getState() === MainButtonState.HIDDEN) {
        lastScrollY = currentScrollY;
        return;
      }

      // Calculate scroll position as percentage (0 = top, 1 = bottom)
      const scrollableHeight = scrollView.scrollableHeight;
      const scrollPercentage = scrollableHeight > 0 ? currentScrollY / scrollableHeight : 0;

      // Material Design 3 Extended FAB behavior:
      // - At top (scrollPercentage < 0.1): Extended FAB
      // - In middle (0.1 <= scrollPercentage <= 0.9): Normal FAB
      // - At bottom (scrollPercentage > 0.9): Extended FAB

      const shouldBeExtended = scrollPercentage < 0.1 || scrollPercentage > 0.9;

      if (shouldBeExtended && !isExtendedByScroll) {
        // Extend the FAB at top/bottom positions
        this.mainButton!.extend();
        isExtendedByScroll = true;
      } else if (!shouldBeExtended && isExtendedByScroll) {
        // Shrink the FAB in middle positions
        this.mainButton!.shrink();
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
   * Assembles the code in the editor
   */
  public assembleGameConsole(): void {
    this.log.debug("assembleGameConsole");

    // Navigate to the debugger tab
    this.navigateToView(ViewType.DEBUGGER);

    // Get code from editor controller and assemble it
    const code = editorController.code;
    this.log.debug("Code to assemble:", code);

    // Reset the code changed flag BEFORE assembling using mainStateController
    mainStateController.setCodeChanged(false);

    // Assemble the code
    this.log.debug("Calling gameConsoleController.assemble...");
    gameConsoleController.assemble(code);
    this.log.debug("gameConsoleController.assemble called");
  }

  /**
   * Runs the assembled code
   */
  public runGameConsole(): void {
    this.log.debug("runGameConsole");

    // Navigate to the game console tab
    this.navigateToView(ViewType.GAME_CONSOLE);

    // Start the simulator
    gameConsoleView.run();
  }

  /**
   * Pauses the running code
   */
  public pauseGameConsole(): void {
    this.log.debug("pauseGameConsole");

    // Pause the simulator
    gameConsoleView.stop();
  }

  /**
   * Resets the simulator
   */
  public reset(): void {
    this.log.debug("reset");

    // Reset debugger
    debuggerView.reset();

    // Reset the simulator
    gameConsoleView.reset();
  }

  /**
   * Executes a single step of the program
   */
  public stepGameConsole(): void {
    this.log.debug("stepGameConsole");

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
    this.log.debug("setEditorCode", code);

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

      const enabledState = mainStateController.getActionEnabledState(currentState, hasCode, codeChanged);

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
    this.log.debug("openMenu");
    // TODO: Implement menu functionality
  }

  public onAssembleTap(): void {
    this.log.debug("onAssembleTap");
    mainStateController.emitAssemble();
  }

  public onRunTap(): void {
    this.log.debug("onRunTap");
    mainStateController.emitRun();
  }

  public onPauseTap(): void {
    this.log.debug("onPauseTap");
    mainStateController.emitPause();
  }

  public onResumeTap(): void {
    this.log.debug("onResumeTap");
    mainStateController.emitResume();
  }

  public onResetTap(): void {
    this.log.debug("onResetTap");
    mainStateController.emitReset();
  }

  public onStepTap(): void {
    this.log.debug("onStepTap");
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
    this.log.debug("Initializing gameConsoleController early");

    // Use partial initialization to set up assembler functionality without widgets
    gameConsoleController.initPartial({
      memory: gameConsoleView.memory,
      simulator: gameConsoleView.simulator,
      assembler: gameConsoleView.assembler,
      labels: gameConsoleView.labels,
    });

    this.log.debug("gameConsoleController partial initialization complete");
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
