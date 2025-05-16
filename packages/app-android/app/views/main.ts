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
import { MainView, gameConsoleService } from "@learn6502/common-ui";
import { SimulatorState } from "@learn6502/6502";
import type { GamepadKey } from "@learn6502/common-ui";

// Import WindowInsetsCompat
import androidx_core_view_WindowInsetsCompat = androidx.core.view.WindowInsetsCompat;
import { SystemAppearanceChangeEvent, WindowInsetsChangeEvent } from "~/types";
import { MainButton } from "~/widgets";

/**
 * MainController class to handle all main page functionality
 * Implements MainView from common-ui
 */
export class MainController implements MainView {
  private page: Page | null = null;
  private actionBar: ActionBar | null = null;
  private mainButton: MainButton | null = null;

  // Current simulator state
  private _state: SimulatorState = SimulatorState.READY;

  /**
   * Get the current simulator state
   */
  get state(): SimulatorState {
    return this._state;
  }

  constructor() {
    // Private constructor for singleton pattern
    console.log("MainController: initialized");
    this.handleWindowInsets = this.handleWindowInsets.bind(this);
    this.onSystemAppearanceChanged = this.onSystemAppearanceChanged.bind(this);
    this.setupAndroidKeyHandling = this.setupAndroidKeyHandling.bind(this);
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
    gameConsoleService.registerKeyMappings({
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
            if (gameConsoleService.handleKeyPress(keyCode)) {
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
    gameConsoleService.on("keyPressed", (event) => {
      console.log("Gamepad key pressed:", event.key, event.keyCode);
      // Add any additional UI feedback or logging here
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
   * Event handler for the 'loaded' event of the root view.
   * Applies system bar insets to ensure content is not drawn under system bars
   * when Edge-to-Edge is enabled.
   * @param args Event arguments containing the view object.
   */
  public onLoaded(args: EventData): void {
    this.page = args.object as Page;
    this.actionBar = this.page.getViewById<ActionBar>("main-action-bar");
    this.mainButton = this.page.getViewById<MainButton>("mainButton");

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
   * Implementation of MainView methods
   */

  /**
   * Assembles the code in the editor
   */
  public assembleGameConsole(): void {
    console.log("assembleGameConsole");

    // Navigate to the debugger tab
    const mainFrame = this.page?.getViewById<Frame>("mainFrame");
    if (mainFrame) {
      mainFrame.navigate({
        moduleName: "views/main/debugger",
        clearHistory: false,
      });
    }

    // TODO: Get code from editor and assemble it
    this._state = SimulatorState.READY;
    this.updateMainButtonState();
  }

  /**
   * Runs the assembled code
   */
  public runGameConsole(): void {
    console.log("runGameConsole");

    // Navigate to the game console tab
    const mainFrame = this.page?.getViewById<Frame>("mainFrame");
    if (mainFrame) {
      mainFrame.navigate({
        moduleName: "views/main/game-console",
        clearHistory: false,
      });
    }

    // TODO: Start the simulator
    this._state = SimulatorState.RUNNING;
    this.updateMainButtonState();
  }

  /**
   * Pauses the running code
   */
  public pauseGameConsole(): void {
    console.log("pauseGameConsole");

    // TODO: Pause the simulator
    if (this._state === SimulatorState.RUNNING) {
      this._state = SimulatorState.PAUSED;
      this.updateMainButtonState();
    }
  }

  /**
   * Resets the simulator
   */
  public reset(): void {
    console.log("reset");

    // TODO: Reset the simulator
    this._state = SimulatorState.READY;
    this.updateMainButtonState();
  }

  /**
   * Executes a single step of the program
   */
  public stepGameConsole(): void {
    console.log("stepGameConsole");

    // Navigate to the debugger tab
    const mainFrame = this.page?.getViewById<Frame>("mainFrame");
    if (mainFrame) {
      mainFrame.navigate({
        moduleName: "views/main/debugger",
        clearHistory: false,
      });
    }

    // TODO: Execute a single step
    if (
      this._state === SimulatorState.READY ||
      this._state === SimulatorState.PAUSED
    ) {
      // Stay in PAUSED state after stepping
      this._state = SimulatorState.PAUSED;
      this.updateMainButtonState();
    }
  }

  /**
   * Sets the code in the editor
   * @param code The code to set
   */
  public setEditorCode(code: string): void {
    console.log("setEditorCode", code);

    // Navigate to the editor tab
    const mainFrame = this.page?.getViewById<Frame>("mainFrame");
    if (mainFrame) {
      mainFrame.navigate({
        moduleName: "views/main/editor",
        clearHistory: false,
      });

      // TODO: Set the code in the editor
    }
  }

  /**
   * Updates the main button state based on the current simulator state
   */
  private updateMainButtonState(): void {
    if (this.mainButton) {
      this.mainButton.updateFromSimulatorState(this._state);
    }
  }

  /**
   * Button event handlers
   */
  public openMenu(): void {
    console.log("openMenu");
  }

  public onAssembleTap(): void {
    console.log("onAssembleTap");
    this.assembleGameConsole();
  }

  public onRunTap(): void {
    console.log("onRunTap");
    this.runGameConsole();
  }

  public onPauseTap(): void {
    console.log("onPauseTap");
    this.pauseGameConsole();
  }

  public onResumeTap(): void {
    console.log("onResumeTap");
    this.runGameConsole();
  }

  public onResetTap(): void {
    console.log("onResetTap");
    this.reset();
  }

  public onStepTap(): void {
    console.log("onStepTap");
    this.stepGameConsole();
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
