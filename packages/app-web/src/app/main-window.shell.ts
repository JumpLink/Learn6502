import type GjsGtk from "@girs/gtk-4.0";
import { Adw, type Gtk } from "@gjsify/adwaita-web";
import { ViewType, mainStateController } from "@learn6502/common-ui";
import { _, type Debugger, type Editor, type GameConsole, type Learn } from "@learn6502/ui";
import type { MainWindowShell, ShellAction, UnsavedChangesAnswer } from "@learn6502/ui";

/** The widgets `MainWindow` builds around the four screens. */
export interface DomShellParts {
  window: Adw.Window;
  learn: Learn;
  editor: Editor;
  debugger: Debugger;
  gameConsole: GameConsole;
  switcherBar: Adw.ViewSwitcherBar;
  sidebarToggle: Gtk.Button;
  learnBackButton: Gtk.Button;
  runControls: HTMLElement;
  titleWidget: Adw.WindowTitle;
}

/** The four screens in stack order, with their tab title and icon. */
const SCREENS = [
  { view: ViewType.LEARN, name: "learn", title: () => _("Learn"), icon: "go-home" },
  { view: ViewType.EDITOR, name: "editor", title: () => _("Code"), icon: "document-edit" },
  { view: ViewType.DEBUGGER, name: "debugger", title: () => _("Debug"), icon: "system-search" },
  { view: ViewType.GAME_CONSOLE, name: "gameConsole", title: () => _("Play"), icon: "application-x-executable" },
] as const;

type ScreenName = (typeof SCREENS)[number]["name"];

/** `<Control><Shift>s` against a key event. */
function matchesAccelerator(event: KeyboardEvent, accelerator: string): boolean {
  const key = accelerator.replace(/<[^>]+>/g, "").toLowerCase();
  return (
    event.key.toLowerCase() === key &&
    event.ctrlKey === accelerator.includes("<Control>") &&
    event.shiftKey === accelerator.includes("<Shift>") &&
    event.altKey === accelerator.includes("<Alt>")
  );
}

/**
 * The slice of `Gtk.Window` the shared window behaviour reads, answered by the document. `close-request`
 * has no listener: `Adw.Window` on the web has no close request to hook (a core gap in gjsify's
 * adwaita-web, not worked around here), so the shell sets `emitsCloseRequest = false`.
 */
class DocumentWindow {
  private readonly events: Record<string, string[]> = {
    "notify::is-active": ["focus", "blur"],
    "notify::focus-widget": ["focusin", "focusout"],
  };

  get is_active(): boolean {
    return document.hasFocus();
  }

  get_focus(): Element | null {
    return document.activeElement;
  }

  connect(signal: string, handler: () => void): number {
    for (const type of this.events[signal] ?? []) window.addEventListener(type, handler, true);
    return 0;
  }
}

/**
 * `MainWindowShell` over the DOM: a view stack on narrow viewports, three columns on wide ones, the
 * switch being the `matchMedia` twin of the GNOME window's `Adw.Breakpoint`s.
 */
export class DomMainWindowShell implements MainWindowShell {
  readonly window: GjsGtk.Window;
  readonly emitsCloseRequest = false;
  /** The element to put into the toast overlay. */
  readonly layoutHost = document.createElement("div");

  private readonly mobileLayout = document.createElement("div");
  private readonly desktopLayout = document.createElement("div");
  private readonly splitView = new Adw.OverlaySplitView();
  private readonly sidebarColumn = document.createElement("div");
  private readonly centerColumn = document.createElement("div");
  private readonly rightTop = document.createElement("div");
  private readonly rightBottom = document.createElement("div");

  // Mirror the GNOME window's breakpoint thresholds
  private readonly desktopMq = window.matchMedia("(min-width: 800px) and (min-height: 600px)");
  private readonly wideMq = window.matchMedia("(min-width: 1000px) and (min-height: 600px)");

  // Persistent per-screen wrappers, re-homed between the two layouts
  private readonly slots: Record<ScreenName, HTMLDivElement>;
  private mobileStack: Adw.ViewStack | null = null;

  private current: ViewType = ViewType.LEARN;
  private onViewChanged: ((view: ViewType, previous: ViewType) => void) | null = null;
  private onLayout: (() => void) | null = null;

  private readonly handlers = new Map<string, () => void>();
  private readonly enabled = new Map<string, boolean>();
  private readonly accelerators: { accelerator: string; name: string }[] = [];
  private actionsChanged: (() => void) | null = null;
  private dialog: Adw.AlertDialog | null = null;

  constructor(private readonly parts: DomShellParts) {
    // Only the members the window behaviour reads exist, hence the cast
    this.window = new DocumentWindow() as unknown as GjsGtk.Window;

    const slotOf = (screen: unknown): HTMLDivElement => {
      const slot = document.createElement("div");
      slot.className = "shell-view-slot";
      // The shared widgets are typed against the GJS bindings; at run time they are custom elements.
      const element = screen as HTMLElement;
      element.classList.add("shell-view-slot");
      slot.appendChild(element);
      return slot;
    };
    this.slots = {
      learn: slotOf(parts.learn),
      editor: slotOf(parts.editor),
      debugger: slotOf(parts.debugger),
      gameConsole: slotOf(parts.gameConsole),
    };

    this.buildLayoutHost();
    parts.sidebarToggle.addEventListener("click", () => this.splitView.toggleSidebar());
    this.layoutHost.addEventListener("notify::visible-child", (event) => {
      const name = (event as CustomEvent<{ name: string }>).detail.name;
      const screen = SCREENS.find((candidate) => candidate.name === name);
      if (screen) this.changeTo(screen.view);
    });
    this.desktopMq.addEventListener("change", () => this.relayout());
    this.wideMq.addEventListener("change", () => this.relayout());
    document.addEventListener("keydown", (event) => this.onKeyDown(event));
  }

  // --- Layout ---

  isDesktopLayout(): boolean {
    return this.desktopMq.matches;
  }

  onLayoutChanged(handler: () => void): void {
    this.onLayout = handler;
  }

  /** Mount the layout for the viewport. The tree must be connected: a view stack rebuilds its pages on connect. */
  mountLayout(): void {
    if (this.isDesktopLayout()) this.mountThreeColumnLayout();
    else this.mountSingleLayout();
  }

  private relayout(): void {
    this.mountLayout();
    this.onLayout?.();
  }

  private buildLayoutHost(): void {
    this.layoutHost.id = "layout-host";
    this.mobileLayout.id = "mobile-layout";
    this.desktopLayout.id = "desktop-layout";

    // Desktop split view: Learn sidebar | (Editor | GameConsole-over-Debugger)
    this.splitView.setAttribute("min-sidebar-width", "260");
    this.splitView.setAttribute("max-sidebar-width", "420");
    this.splitView.setAttribute("sidebar-width-fraction", "0.25");

    this.sidebarColumn.className = "shell-sidebar-column";
    this.sidebarColumn.setAttribute("slot", "sidebar");

    const centerRight = document.createElement("div");
    centerRight.className = "shell-center-right";
    centerRight.setAttribute("slot", "content");

    this.centerColumn.className = "shell-center-column";
    this.rightTop.className = "shell-right-top";
    this.rightBottom.className = "shell-right-bottom";
    const rightColumn = document.createElement("div");
    rightColumn.className = "shell-right-column";
    rightColumn.append(this.rightTop, this.rightBottom);
    centerRight.append(this.centerColumn, rightColumn);

    this.splitView.append(this.sidebarColumn, centerRight);
    this.desktopLayout.appendChild(this.splitView);

    this.layoutHost.append(this.mobileLayout, this.desktopLayout);
  }

  private mountSingleLayout(): void {
    const stack = new Adw.ViewStack();
    // Connect first (empty), THEN add pages: connecting rebuilds from declared children and would wipe pre-adds
    this.mobileLayout.replaceChildren(stack);
    for (const screen of SCREENS) {
      this.resetSlot(this.slots[screen.name]);
      stack.add(this.slots[screen.name], screen.name, screen.title(), screen.icon);
    }
    stack.visibleChildName = SCREENS.find((screen) => screen.view === this.current)?.name ?? "editor";
    this.mobileStack = stack;

    const { switcherBar, sidebarToggle, runControls } = this.parts;
    switcherBar.setStack(stack);
    switcherBar.reveal = true;
    sidebarToggle.hidden = true;
    // The run controls are desktop-only; the phone layout gets the main button
    runControls.hidden = true;

    this.mobileLayout.hidden = false;
    this.desktopLayout.hidden = true;
  }

  private mountThreeColumnLayout(): void {
    this.homeSlot(this.slots.learn, this.sidebarColumn);
    this.homeSlot(this.slots.editor, this.centerColumn);
    this.homeSlot(this.slots.gameConsole, this.rightTop);
    this.homeSlot(this.slots.debugger, this.rightBottom);

    const { switcherBar, sidebarToggle, runControls } = this.parts;
    switcherBar.setStack(null);
    switcherBar.reveal = false;
    this.mobileStack = null;
    this.mobileLayout.replaceChildren();

    sidebarToggle.hidden = false;
    runControls.hidden = false;
    // Wide windows dock the sidebar; medium ones overlay it
    const wide = this.wideMq.matches;
    this.splitView.collapsed = !wide;
    this.splitView.showSidebar = wide;

    this.desktopLayout.hidden = false;
    this.mobileLayout.hidden = true;

    this.current = ViewType.EDITOR;
    mainStateController.setViewType(ViewType.EDITOR);
  }

  private homeSlot(slot: HTMLDivElement, parent: HTMLElement): void {
    this.resetSlot(slot);
    parent.appendChild(slot);
  }

  private resetSlot(slot: HTMLDivElement): void {
    slot.hidden = false;
    slot.classList.remove("adw-view-stack-child", "active-view");
  }

  // --- Views ---

  activeView(): ViewType {
    return this.current;
  }

  showView(view: ViewType): void {
    const screen = SCREENS.find((candidate) => candidate.view === view);
    if (!screen || !this.mobileStack) return;
    this.mobileStack.visibleChildName = screen.name;
    this.changeTo(view);
  }

  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void {
    this.onViewChanged = handler;
  }

  private changeTo(view: ViewType): void {
    const previous = this.current;
    this.current = view;
    if (view !== previous) {
      // Preserve the reading position and the editor state across tab switches
      if (previous === ViewType.LEARN) this.parts.learn.saveScrollPosition();
      if (previous === ViewType.EDITOR) this.parts.editor.saveState();
      if (view === ViewType.LEARN) this.parts.learn.restoreScrollPosition();
    }
    this.onViewChanged?.(view, previous);
  }

  setLearnBackVisible(visible: boolean): void {
    this.parts.learnBackButton.hidden = !visible;
  }

  setFileTitle(filename: string): void {
    this.parts.titleWidget.setAttribute("subtitle", filename);
  }

  closeSidebarIfOverlay(): void {
    if (this.isDesktopLayout() && this.splitView.collapsed) this.splitView.showSidebar = false;
  }

  isInsideConsole(widget: GjsGtk.Widget | null): boolean {
    return !!widget && (this.parts.gameConsole as unknown as Node).contains(widget as unknown as Node);
  }

  // --- Actions ---

  addAction(name: string, activate: () => void, accels: string[] = []): ShellAction {
    this.handlers.set(name, activate);
    this.enabled.set(name, true);
    for (const accelerator of accels) {
      this.accelerators.push({ accelerator, name });
    }
    return {
      setEnabled: (enabled) => {
        this.enabled.set(name, enabled);
        this.actionsChanged?.();
      },
    };
  }

  isActionEnabled(name: string): boolean {
    return this.enabled.get(name) ?? false;
  }

  /** Fire an action as its button, menu item or shortcut would. */
  activate(name: string): void {
    if (this.isActionEnabled(name)) this.handlers.get(name)?.();
  }

  onActionsChanged(handler: () => void): void {
    this.actionsChanged = handler;
  }

  private onKeyDown(event: KeyboardEvent): void {
    for (const { accelerator, name } of this.accelerators) {
      if (!matchesAccelerator(event, accelerator)) continue;
      // The browser's own Ctrl+S / Ctrl+O would otherwise take the key
      event.preventDefault();
      this.activate(name);
      return;
    }
  }

  // --- Dialog, closing ---

  askUnsavedChanges(): Promise<UnsavedChangesAnswer> {
    const dialog = this.dialog ?? this.createUnsavedChangesDialog();
    return new Promise((resolve) => {
      dialog.addEventListener(
        "response",
        (event) => {
          const response = (event as CustomEvent<{ response: string }>).detail.response;
          resolve(response === "save" || response === "discard" ? response : "cancel");
        },
        { once: true }
      );
      dialog.present();
    });
  }

  private createUnsavedChangesDialog(): Adw.AlertDialog {
    const dialog = new Adw.AlertDialog();
    // TRANSLATORS: Alert dialog heading when unsaved changes are present
    dialog.heading = _("Save changes?");
    // TRANSLATORS: Alert dialog body explaining risk of losing changes
    dialog.body = _("Your file has unsaved changes. Changes will be lost if you don't save them.");
    // TRANSLATORS: Alert dialog button labels
    dialog.addResponse("cancel", _("Cancel"));
    dialog.addResponse("discard", _("Discard"));
    dialog.addResponse("save", _("Save"));
    dialog.setResponseAppearance("discard", "destructive");
    dialog.setResponseAppearance("save", "suggested");
    dialog.closeResponse = "cancel";
    this.parts.window.appendChild(dialog);
    this.dialog = dialog;
    return dialog;
  }

  closeWindow(): void {
    window.close();
  }
}
