import type Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import type Gtk from "@girs/gtk-4.0";

import { ViewType } from "@learn6502/common-ui";
import {
  type Debugger,
  type Editor,
  type GameConsole,
  type Learn,
  type MainWindowShell,
  type ShellAction,
  type UnsavedChangesAnswer,
  type WindowSettings,
} from "@learn6502/ui";

/** The widgets the window's template provides for placing the four screens. */
export interface MainWindowShellParts {
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
  unsavedChangesDialog: Adw.AlertDialog;
  titleLabel: Gtk.Label;
  learnBackButton: Gtk.Button;
}

/** `MainWindowShell` over the GTK widgets of `main.window.blp`. */
export class GtkMainWindowShell implements MainWindowShell<Gtk.Widget> {
  private readonly viewWidgets = new Map<ViewType, Gtk.Widget>();
  private previousVisibleChild: Gtk.Widget | null = null;

  constructor(
    readonly window: Adw.ApplicationWindow,
    private readonly parts: MainWindowShellParts
  ) {
    this.viewWidgets.set(ViewType.LEARN, parts.learn);
    this.viewWidgets.set(ViewType.EDITOR, parts.editor);
    this.viewWidgets.set(ViewType.DEBUGGER, parts.debugger);
    this.viewWidgets.set(ViewType.GAME_CONSOLE, parts.gameConsole);
  }

  onFocusWidgetChanged(handler: () => void): void {
    this.window.connect("notify::focus-widget", handler);
  }

  persistWindowSize(settings: WindowSettings): void {
    const { window } = this;
    try {
      if (settings.getBoolean("is-maximized")) {
        window.maximize();
      } else {
        window.set_default_size(settings.getInt("window-width"), settings.getInt("window-height"));
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
    this.parts.layoutHost.connect("notify::visible-child-name", () => {
      this.mountLayout();
      handler();
    });
  }

  mountLayout(): void {
    if (this.isDesktopLayout()) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
    this.previousVisibleChild = this.parts.stack.get_visible_child();
  }

  activeView(): ViewType {
    return this.viewOf(this.parts.stack.get_visible_child());
  }

  showView(view: ViewType): void {
    const widget = this.viewWidgets.get(view);
    if (widget) this.parts.stack.set_visible_child(widget);
    else console.error(`showView: Widget not found for view ${view}`);
  }

  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void {
    this.parts.stack.connect("notify::visible-child", () => {
      const { learn } = this.parts;
      const current = this.parts.stack.get_visible_child();
      const previous = this.previousVisibleChild;
      this.previousVisibleChild = current;

      if (previous === learn && current !== learn) {
        learn.saveScrollPosition();
      }
      if (current === learn && previous !== learn) {
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

      handler(this.viewOf(current), this.viewOf(previous));
    });
  }

  setLearnBackVisible(visible: boolean): void {
    this.parts.learnBackButton.visible = visible;
  }

  setFileTitle(filename: string): void {
    this.parts.titleLabel.label = filename;
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
    if (accels) this.window.get_application()?.set_accels_for_action(`win.${name}`, accels);
    return { setEnabled: (enabled) => action.set_enabled(enabled) };
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

  private viewOf(widget: Gtk.Widget | null): ViewType {
    for (const [view, candidate] of this.viewWidgets.entries()) {
      if (candidate === widget) return view;
    }
    return ViewType.LEARN;
  }

  /** Mobile: all views as pages of one stack. */
  private mountSingleLayout(): void {
    const { stack, learn, editor, debugger: debuggerView, gameConsole } = this.parts;
    for (const view of [learn, editor, debuggerView, gameConsole]) this.detachFromParent(view);

    const pages = stack.get_pages();
    const toRemove: Gtk.Widget[] = [];
    for (let i = 0; i < pages.get_n_items(); i++) {
      const child = (pages.get_item(i) as Gtk.StackPage).get_child();
      if (child) toRemove.push(child);
    }
    for (const child of toRemove) stack.remove(child);

    // TRANSLATORS: ViewSwitcher/tab title for the Learn/Tutorial view
    stack.add_titled_with_icon(learn, "learn", _("Learn"), "school-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Editor view
    stack.add_titled_with_icon(editor, "editor", _("Code"), "code-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Debugger view
    stack.add_titled_with_icon(debuggerView, "debugger", _("Debug"), "bug-symbolic");
    // TRANSLATORS: ViewSwitcher/tab title for the Game Console view
    stack.add_titled_with_icon(gameConsole, "gameConsole", _("Play"), "nintendo-controller-symbolic");

    this.parts.switcherBar.set_stack(stack);
    // The debugger scrolls on its own when it fills a whole page
    debuggerView.scrollable = true;
  }

  /** Desktop: Learn | Editor | Game Console over Debugger. */
  private mountThreeColumnLayout(): void {
    const { learn, editor, gameConsole, debugger: debuggerView } = this.parts;
    for (const box of [
      this.parts.leftColumn,
      this.parts.centerColumn,
      this.parts.rightTopBox,
      this.parts.rightBottomBox,
    ]) {
      this.clearBoxChildren(box);
    }

    const placements: [Gtk.Widget, Gtk.Box][] = [
      [learn, this.parts.leftColumn],
      [editor, this.parts.centerColumn],
      [gameConsole, this.parts.rightTopBox],
      [debuggerView, this.parts.rightBottomBox],
    ];
    for (const [view, box] of placements) {
      this.detachFromParent(view);
      box.append(view);
    }

    // The right column scrolls as a whole
    debuggerView.scrollable = false;
    this.parts.switcherBar.set_stack(null);
  }

  private clearBoxChildren(box: Gtk.Box): void {
    let child = box.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      box.remove(child);
      child = next;
    }
  }

  private detachFromParent(widget: Gtk.Widget): void {
    const parent = widget.get_parent() as (Gtk.Widget & { remove?: (child: Gtk.Widget) => void }) | null;
    parent?.remove?.(widget);
  }
}
