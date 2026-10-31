import type Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import type Gtk from "@girs/gtk-4.0";

import { ViewType } from "../views/index.ts";
import { mainStateController } from "../controller/index.ts";

import type { Debugger } from "../debugger/debugger.ts";
import type { Editor } from "../editor/editor.ts";
import type { GameConsole } from "../game-console/game-console.ts";
import type { Learn } from "../learn/learn.ts";
import { _ } from "../translate.ts";
import type { MainWindowShell, ShellAction, UnsavedChangesAnswer } from "./shell.ts";
import type { WindowSettings } from "./services.ts";
import { createWindowShellPlatform, type WindowShellPlatform } from "./window-shell-platform.ts";

/** The widgets `main.window.blp` provides for placing the four screens. */
export interface WindowShellParts {
  editor: Editor;
  gameConsole: GameConsole;
  learn: Learn;
  debugger: Debugger;
  stack: Adw.ViewStack;
  switcherBar: Adw.ViewSwitcherBar;
  layoutHost: Gtk.Stack;
  leftSidebar: Adw.OverlaySplitView;
  leftColumn: Gtk.Box;
  centerColumn: Gtk.Box;
  rightTopBox: Gtk.Box;
  rightBottomBox: Gtk.Box;
  rightColumnContent: Gtk.Box;
  unsavedChangesDialog: Adw.AlertDialog;
  titleLabel: Gtk.Label;
  unsavedChangesIndicator: Gtk.Button;
  learnBackButton: Gtk.Button;
}

export interface WindowShellOptions {
  /** The screen the app opens on, and the one the wide layout reports as active; Learn by default. */
  initialView?: ViewType;
}

type ScreenId = "learn" | "editor" | "debugger" | "gameConsole";

/** The four screens in stack order, with their tab title and icon. */
const STACK_PAGES: { id: ScreenId; view: ViewType; title: () => string; icon: string }[] = [
  // TRANSLATORS: ViewSwitcher/tab title for the Learn/Tutorial view
  { id: "learn", view: ViewType.LEARN, title: () => _("Learn"), icon: "school-symbolic" },
  // TRANSLATORS: ViewSwitcher/tab title for the Editor view
  { id: "editor", view: ViewType.EDITOR, title: () => _("Code"), icon: "code-symbolic" },
  // TRANSLATORS: ViewSwitcher/tab title for the Debugger view
  { id: "debugger", view: ViewType.DEBUGGER, title: () => _("Debug"), icon: "bug-symbolic" },
  // TRANSLATORS: ViewSwitcher/tab title for the Game Console view
  { id: "gameConsole", view: ViewType.GAME_CONSOLE, title: () => _("Play"), icon: "nintendo-controller-symbolic" },
];

/**
 * `MainWindowShell` over the widgets of `main.window.blp`, for every platform: the stack on narrow
 * windows, the columns on wide ones, as the window's `Adw.Breakpoint`s decide. What only one
 * platform needs lives in `window-shell-platform`.
 */
export class WindowShell implements MainWindowShell<Gtk.Widget> {
  private readonly platform: WindowShellPlatform;
  private current: ViewType;
  private readonly home: ViewType;
  private mounting = false;
  private readonly viewHandlers: ((view: ViewType, previous: ViewType) => void)[] = [];
  private readonly layoutHandlers: (() => void)[] = [];

  constructor(
    readonly window: Adw.ApplicationWindow,
    private readonly parts: WindowShellParts,
    options: WindowShellOptions = {}
  ) {
    this.home = options.initialView ?? ViewType.LEARN;
    this.current = this.home;
    this.platform = createWindowShellPlatform({ window, ...parts });
    parts.stack.connect("notify::visible-child-name", () => this.onStackChanged());
    parts.layoutHost.connect("notify::visible-child-name", () => {
      this.mountLayout();
      for (const handler of this.layoutHandlers) handler();
    });
  }

  onFocusWidgetChanged(handler: () => void): void {
    this.platform.watchFocusWidget(handler);
  }

  persistWindowSize(settings: WindowSettings): void {
    const { window } = this;
    try {
      if (settings.getBoolean("is-maximized")) {
        window.maximize();
      } else {
        const width = settings.getInt("window-width");
        const height = settings.getInt("window-height");
        // A platform without a saved size answers 0
        if (width > 0 && height > 0) window.set_default_size(width, height);
      }
    } catch (error) {
      console.warn("Could not load window size from settings:", error);
      // Fall back to the Blueprint defaults
    }

    const saveSize = () => {
      if (window.is_maximized()) return; // A maximized window's size says nothing about the restored one
      try {
        const [width, height] = window.get_default_size();
        settings.setInt("window-width", width);
        settings.setInt("window-height", height);
      } catch (error) {
        console.warn("Could not save window size to settings:", error);
      }
    };

    window.connect("notify::default-width", saveSize);
    window.connect("notify::default-height", saveSize);
    window.connect("notify::maximized", () => settings.setBoolean("is-maximized", window.is_maximized()));
  }

  isDesktopLayout(): boolean {
    return this.parts.layoutHost.get_visible_child_name() === "three";
  }

  onLayoutChanged(handler: () => void): void {
    this.layoutHandlers.push(handler);
  }

  mountLayout(): void {
    if (this.isDesktopLayout()) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
    this.platform.layoutMounted(this.isDesktopLayout());
  }

  activeView(): ViewType {
    return this.current;
  }

  showView(view: ViewType): void {
    const page = STACK_PAGES.find((candidate) => candidate.view === view);
    if (!page) {
      console.error(`showView: Widget not found for view ${view}`);
      return;
    }
    this.parts.stack.set_visible_child_name(page.id); // notifies if it changed
    this.onStackChanged(); // covers the already-on-that-view case
  }

  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void {
    this.viewHandlers.push(handler);
  }

  setLearnBackVisible(visible: boolean): void {
    this.parts.learnBackButton.visible = visible;
  }

  setFileTitle(filename: string): void {
    this.parts.titleLabel.label = filename;
  }

  setUnsavedIndicator(visible: boolean, tooltip: string): void {
    this.parts.unsavedChangesIndicator.visible = visible;
    this.parts.unsavedChangesIndicator.tooltip_text = tooltip;
  }

  closeSidebarIfOverlay(): void {
    if (this.isDesktopLayout() && this.parts.leftSidebar.collapsed) {
      this.parts.leftSidebar.show_sidebar = false;
    }
  }

  isInsideConsole(widget: Gtk.Widget | null): boolean {
    let current: Gtk.Widget | null = widget;
    while (current) {
      if (current === this.parts.gameConsole) return true;
      current = current.get_parent();
    }
    return false;
  }

  addAction(name: string, activate: () => void, accels?: string[]): ShellAction {
    const action = new Gio.SimpleAction({ name });
    action.connect("activate", () => activate());
    this.window.add_action(action);
    // The window's application keeps the accelerators; it is linked before the controller registers actions.
    if (accels) this.window.get_application()?.set_accels_for_action(`win.${name}`, accels);
    return {
      setEnabled: (enabled) => {
        action.enabled = enabled;
      },
    };
  }

  askUnsavedChanges(): Promise<UnsavedChangesAnswer> {
    const { unsavedChangesDialog } = this.parts;
    return new Promise((resolve) => {
      const handlerId = unsavedChangesDialog.connect("response", (_dialog: Adw.AlertDialog, response: string) => {
        unsavedChangesDialog.disconnect(handlerId);
        resolve(response === "save" || response === "discard" ? response : "cancel");
      });
      unsavedChangesDialog.present(this.window);
    });
  }

  closeWindow(): void {
    this.window.close();
  }

  private widgetOf(id: ScreenId): Gtk.Widget {
    return this.parts[id];
  }

  private onStackChanged(): void {
    if (this.mounting || this.isDesktopLayout()) return;
    const name = this.parts.stack.get_visible_child_name();
    const page = STACK_PAGES.find((candidate) => candidate.id === name);
    if (!page) return;

    const previous = this.current;
    this.current = page.view;
    if (page.view !== previous) this.keepStateAcrossTabs(previous, page.view);
    for (const handler of this.viewHandlers) handler(page.view, previous);
  }

  /** Preserve the reading position and the editor state across tab switches. */
  private keepStateAcrossTabs(previous: ViewType, view: ViewType): void {
    const { learn, editor } = this.parts;
    if (previous === ViewType.LEARN) learn.saveScrollPosition();
    if (previous === ViewType.EDITOR) editor.saveState();
    if (view !== ViewType.LEARN) return;
    // The Learn widget has to be mapped before its scroll position can be restored
    if (learn.get_mapped()) {
      learn.restoreScrollPosition();
    } else {
      const handlerId = learn.connect("map", () => {
        learn.restoreScrollPosition();
        learn.disconnect(handlerId);
      });
    }
  }

  /** Mobile: all views as pages of one stack. */
  private mountSingleLayout(): void {
    const { stack, switcherBar, debugger: debuggerView } = this.parts;
    const keep = STACK_PAGES.find((page) => page.view === this.current) ?? STACK_PAGES[0]!;

    this.mounting = true;
    try {
      this.detachScreens();
      for (const page of STACK_PAGES) {
        stack.add_titled_with_icon(this.widgetOf(page.id), page.id, page.title(), page.icon);
      }
      switcherBar.set_stack(stack);
      // The debugger scrolls on its own when it fills a whole page
      debuggerView.scrollable = true;
      stack.set_visible_child_name(keep.id);
    } finally {
      this.mounting = false;
    }
    this.onStackChanged();
  }

  /** Desktop: Learn | Editor | Game Console over Debugger. */
  private mountThreeColumnLayout(): void {
    const { leftColumn, centerColumn, rightTopBox, rightBottomBox, debugger: debuggerView } = this.parts;

    this.detachScreens();
    leftColumn.append(this.widgetOf("learn"));
    centerColumn.append(this.widgetOf("editor"));
    rightTopBox.append(this.widgetOf("gameConsole"));
    rightBottomBox.append(this.widgetOf("debugger"));
    for (const page of STACK_PAGES) this.widgetOf(page.id).visible = true;

    // The right column scrolls as a whole
    debuggerView.scrollable = false;
    this.parts.switcherBar.set_stack(null);
    this.current = this.home;
    mainStateController.setViewType(this.home);
  }

  /** Take every screen out of whichever container holds it, ready for the other layout. */
  private detachScreens(): void {
    const { stack, leftColumn, centerColumn, rightTopBox, rightBottomBox } = this.parts;
    for (const page of STACK_PAGES) {
      const widget = this.widgetOf(page.id);
      for (const container of [stack, leftColumn, centerColumn, rightTopBox, rightBottomBox]) {
        if (widget.get_parent() === container) container.remove(widget);
      }
    }
  }
}
