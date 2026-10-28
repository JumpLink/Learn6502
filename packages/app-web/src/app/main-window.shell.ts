import { Gio, type Adw, type Gtk } from "@gjsify/adwaita-web";
import { ViewType, mainStateController } from "@learn6502/common-ui";
import { _, type Debugger, type Editor, type GameConsole, type Learn } from "@learn6502/ui";
import type { MainWindowShell, ShellAction, UnsavedChangesAnswer } from "@learn6502/ui";

/** The four screens, by the id `main.window.blp` gives the object that stands for each. */
export interface DomScreens {
  learn: Learn;
  editor: Editor;
  debugger: Debugger;
  gameConsole: GameConsole;
}

/** The widgets `main.window.blp` builds, as the shell places the screens in them. */
export interface DomShellParts {
  window: Adw.ApplicationWindow;
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
  unsavedChangesIndicator: Gtk.Button;
  learnBackButton: Gtk.Button;
}

/** The four screens in stack order, with their tab title and icon. */
const STACK_PAGES = [
  { id: "learn", view: ViewType.LEARN, title: () => _("Learn"), icon: "school-symbolic" },
  { id: "editor", view: ViewType.EDITOR, title: () => _("Code"), icon: "code-symbolic" },
  { id: "debugger", view: ViewType.DEBUGGER, title: () => _("Debug"), icon: "bug-symbolic" },
  { id: "gameConsole", view: ViewType.GAME_CONSOLE, title: () => _("Play"), icon: "nintendo-controller-symbolic" },
] as const;

/**
 * `MainWindowShell` over the `@gjsify/adwaita-web` elements of `main.window.blp`: the stack on
 * narrow windows, the columns on wide ones, as the GNOME window's `Adw.Breakpoint`s decide.
 */
export class DomMainWindowShell implements MainWindowShell<Element> {
  readonly window: Adw.ApplicationWindow;

  private current: ViewType = ViewType.EDITOR;
  private onViewChanged: ((view: ViewType, previous: ViewType) => void) | null = null;

  constructor(
    private readonly parts: DomShellParts,
    private readonly screens: DomScreens
  ) {
    this.window = parts.window;
    // so `close()` hides the frame instead of detaching it and leaving a blank page
    parts.window.hide_on_close = true;
    // `notify::*` bubbles in the DOM, so a nested stack's must not count as this one's
    parts.stack.addEventListener("notify::visible-child-name", (event) => {
      if (event.target === parts.stack) this.onStackChanged(parts.stack.get_visible_child_name() ?? "");
    });
  }

  private element(id: keyof DomScreens): HTMLElement {
    // The shared widgets are typed against the GJS bindings; at run time they are custom elements.
    return this.screens[id] as unknown as HTMLElement;
  }

  // --- Layout ---

  isDesktopLayout(): boolean {
    return this.parts.layoutHost.get_visible_child_name() === "three";
  }

  onLayoutChanged(handler: () => void): void {
    const { layoutHost } = this.parts;
    layoutHost.addEventListener("notify::visible-child-name", (event) => {
      if (event.target !== layoutHost) return;
      this.mountLayout();
      handler();
    });
  }

  mountLayout(): void {
    if (this.isDesktopLayout()) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
  }

  private mountSingleLayout(): void {
    const { stack, switcherBar } = this.parts;
    const keep = STACK_PAGES.find((page) => page.view === this.current)?.id ?? "editor";
    this.removeStackPages();
    for (const page of STACK_PAGES) stack.add_titled_with_icon(this.element(page.id), page.id, page.title(), page.icon);
    switcherBar.set_stack(stack);
    this.screens.debugger.scrollable = true;
    stack.set_visible_child_name(keep);
    this.onStackChanged(stack.get_visible_child_name() ?? "");
  }

  private removeStackPages(): void {
    for (const page of STACK_PAGES) this.parts.stack.remove(this.element(page.id));
  }

  private mountThreeColumnLayout(): void {
    const { switcherBar } = this.parts;
    this.removeStackPages();
    this.parts.leftColumn.append(this.element("learn"));
    this.parts.centerColumn.append(this.element("editor"));
    this.parts.rightTopBox.append(this.element("gameConsole"));
    this.parts.rightBottomBox.append(this.element("debugger"));
    for (const page of STACK_PAGES) this.screens[page.id].visible = true;
    this.screens.debugger.scrollable = false;
    // No bottom bar in columns; the screens are all on show.
    switcherBar.set_stack(null);
    this.current = ViewType.EDITOR;
    mainStateController.setViewType(ViewType.EDITOR);
  }

  // --- Views ---

  activeView(): ViewType {
    return this.current;
  }

  showView(view: ViewType): void {
    const page = STACK_PAGES.find((candidate) => candidate.view === view);
    if (!page) return;
    this.parts.stack.set_visible_child_name(page.id); // notifies if it changed
    this.onStackChanged(page.id); // covers the already-on-that-view case
  }

  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void {
    this.onViewChanged = handler;
  }

  private onStackChanged(name: string): void {
    const page = STACK_PAGES.find((candidate) => candidate.id === name);
    if (!page || this.isDesktopLayout()) return;
    const previous = this.current;
    this.current = page.view;
    if (page.view !== previous) {
      // Preserve the reading position and the editor state across tab switches
      if (previous === ViewType.LEARN) this.screens.learn.saveScrollPosition();
      if (previous === ViewType.EDITOR) this.screens.editor.saveState();
      if (page.view === ViewType.LEARN) this.screens.learn.restoreScrollPosition();
    }
    this.onViewChanged?.(page.view, previous);
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
    const { leftSidebar } = this.parts;
    if (this.isDesktopLayout() && leftSidebar.collapsed) leftSidebar.set_show_sidebar(false);
  }

  isInsideConsole(widget: Element | null): boolean {
    return !!widget && this.element("gameConsole").contains(widget);
  }

  onFocusWidgetChanged(handler: () => void): void {
    this.window.connect("notify::focus-widget", handler);
  }

  /** The browser tab owns its size. */
  persistWindowSize(): void {}

  // --- Actions ---

  addAction(name: string, activate: () => void, accels?: string[]): ShellAction {
    const action = new Gio.SimpleAction({ name });
    action.connect("activate", () => activate());
    this.window.add_action(action);
    // The window's application runs the accelerators; it is linked before the controller registers actions.
    if (accels) this.window.get_application()?.set_accels_for_action(`win.${name}`, accels);
    return {
      setEnabled: (enabled) => {
        action.enabled = enabled;
      },
    };
  }

  // --- Dialog, closing ---

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
}
