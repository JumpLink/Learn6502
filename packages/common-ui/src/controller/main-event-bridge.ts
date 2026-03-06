import { mainStateController } from "./main-ui-state-controller.ts";
import { editorController } from "./editor-controller.ts";
import { learnController } from "./learn-controller.ts";
import type { MainView, ViewType } from "../views/main.ts";

/**
 * Callbacks for platform-specific behavior in the main event bridge.
 */
export interface MainEventBridgeCallbacks {
  /** The MainView implementation to delegate actions to. */
  mainView: MainView;
  /** Called when the editor code changes (to update UI indicators). */
  onStateChanged(): void;
  /** Called when code is copied from Learn to Editor. */
  onLearnCodeCopied(code: string): void;
  /** Show a notification with a translatable key. */
  showNotification(key: string): void;
}

type EventUnsubscriber = () => void;

/**
 * Bridges mainStateController, editorController, and learnController events
 * to the MainView and platform-specific callbacks.
 *
 * Eliminates duplicated event wiring from both Android and GNOME main views.
 */
export class MainEventBridge {
  private unsubscribers: EventUnsubscriber[] = [];

  constructor(private readonly callbacks: MainEventBridgeCallbacks) {}

  /**
   * Connect all event listeners. Call during view initialization.
   */
  connect(): void {
    this.disconnect();
    const { mainView } = this.callbacks;

    // Main state events
    this.onMain("state-changed", () => {
      this.callbacks.onStateChanged();
    });

    this.onMain("state-changed:code-changed", () => {
      this.callbacks.onStateChanged();
    });

    this.onMain("assemble", () => {
      mainView.assembleGameConsole();
    });

    this.onMain("run", () => {
      mainView.runGameConsole();
    });

    this.onMain("pause", () => {
      mainView.pauseGameConsole();
    });

    this.onMain("resume", () => {
      mainView.runGameConsole();
    });

    this.onMain("reset", () => {
      mainView.reset();
    });

    this.onMain("step", () => {
      mainView.stepGameConsole();
    });

    this.onMain("navigate-to-view", ({ viewType }) => {
      mainView.navigateToView(viewType as ViewType);
    });

    // Editor events
    const onEditorChanged = () => {
      mainStateController.setCodeChanged(true);
    };
    editorController.events.on("changed", onEditorChanged);
    this.unsubscribers.push(() =>
      editorController.events.off("changed", onEditorChanged),
    );

    // Learn events
    const onLearnCopy = ({ code }: { code: string }) => {
      mainView.setEditorCode(code);
      this.callbacks.onLearnCodeCopied(code);
      this.callbacks.showNotification("code-copied-to-editor");
    };
    learnController.on("copy", onLearnCopy);
    this.unsubscribers.push(() => learnController.off("copy", onLearnCopy));
  }

  /**
   * Disconnect all event listeners. Call during view teardown.
   */
  disconnect(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
  }

  private onMain<K extends keyof import("../types").MainUiStateEventMap>(
    event: K,
    callback: (data: import("../types").MainUiStateEventMap[K]) => void,
  ): void {
    mainStateController.events.on(event, callback);
    this.unsubscribers.push(() =>
      mainStateController.events.off(event, callback),
    );
  }
}
