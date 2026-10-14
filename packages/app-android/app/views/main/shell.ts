import type { View } from "@nativescript/core";
import type GjsGtk from "@girs/gtk-4.0";
import { Application, GridLayout } from "@nativescript/core";
import { localize as _ } from "@nativescript/localize";
import { Gio, NOTIFY_VISIBLE_CHILD, insertActionGroup, padForSystemInsets } from "@gjsify/adwaita-nativescript";
import type { Adw, Gtk } from "@gjsify/adwaita-nativescript";
import { ViewType, mainStateController } from "@learn6502/common-ui";
import type { MainWindowShell, ShellAction, UnsavedChangesAnswer } from "@learn6502/ui";
import { schoolSymbolic, codeSymbolic, bugSymbolic, nintendoControllerSymbolic } from "~/icons";
import type { Screens } from "./screens";

/** The four screens, in the order the stack lists them, with their tab title and icon. */
const STACK_PAGES: { id: keyof Screens; view: ViewType; title: () => string; icon: string }[] = [
  { id: "learn", view: ViewType.LEARN, title: () => _("Learn"), icon: schoolSymbolic },
  { id: "editor", view: ViewType.EDITOR, title: () => _("Code"), icon: codeSymbolic },
  { id: "debugger", view: ViewType.DEBUGGER, title: () => _("Debug"), icon: bugSymbolic },
  { id: "gameConsole", view: ViewType.GAME_CONSOLE, title: () => _("Play"), icon: nintendoControllerSymbolic },
];

/** The widgets `main.window.blp` builds, as the shell places the screens in them. */
export interface NativeShellParts {
  /** The built window; the NativeScript `Adw.ApplicationWindow`. */
  root: View;
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
  learnBackButton: Gtk.Button;
}

/**
 * `MainWindowShell` over the NativeScript Adwaita widgets: the stack on narrow windows, the
 * columns on wide ones, as the GNOME window's `Adw.Breakpoint`s decide.
 */
export class NativeMainWindowShell implements MainWindowShell {
  readonly window: GjsGtk.Window;

  private readonly actionGroup = new Gio.SimpleActionGroup();
  private releaseColumnInsets: (() => void) | null = null;
  private currentName: string | null = null;
  private current: ViewType = ViewType.EDITOR;
  private onViewChanged: ((view: ViewType, previous: ViewType) => void) | null = null;

  constructor(
    private readonly parts: NativeShellParts,
    private readonly screens: Screens
  ) {
    // The root is the NativeScript Adw.ApplicationWindow, typed against GJS in the shared package.
    this.window = parts.root as unknown as GjsGtk.Window;
    // The unsaved-changes card is an in-page modal painted over everything, as the About dialog is.
    const dialog = parts.unsavedChangesDialog as unknown as View;
    GridLayout.setRow(dialog, 0);
    GridLayout.setColumn(dialog, 0);
    (parts.root as GridLayout).addChild(dialog);
    parts.stack.addEventListener(NOTIFY_VISIBLE_CHILD, () => this.onStackChanged(parts.stack.visibleChildName));
  }

  isDesktopLayout(): boolean {
    return this.parts.layoutHost.visibleChildName === "three";
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
  }

  activeView(): ViewType {
    return this.current;
  }

  showView(view: ViewType): void {
    const page = STACK_PAGES.find((candidate) => candidate.view === view);
    if (!page) return;
    this.parts.stack.visibleChildName = page.id; // fires notify::visible-child if changed
    this.onStackChanged(page.id); // covers the already-on-that-view case
  }

  onActiveViewChanged(handler: (view: ViewType, previous: ViewType) => void): void {
    this.onViewChanged = handler;
  }

  setLearnBackVisible(visible: boolean): void {
    this.parts.learnBackButton.visibility = visible ? "visible" : "collapsed";
  }

  setFileTitle(filename: string): void {
    this.parts.titleLabel.label = filename;
  }

  closeSidebarIfOverlay(): void {
    if (this.isDesktopLayout() && this.parts.leftSidebar.collapsed) this.parts.leftSidebar.showSidebar = false;
  }

  // The focus follow is a desktop-layout matter and nothing here takes the focus.
  isInsideConsole(): boolean {
    return false;
  }

  addAction(name: string, activate: () => void, accels?: string[]): ShellAction {
    const action = new Gio.SimpleAction({ name });
    action.connect("activate", () => activate());
    this.actionGroup.add_action(action);
    // The window's application keeps the accelerators; it is linked before the controller registers actions.
    if (accels) this.window.application?.set_accels_for_action(`win.${name}`, accels);
    return {
      setEnabled: (enabled) => {
        action.enabled = enabled;
      },
    };
  }

  /** The `win` action group the main button and the run toolbar fire (their `action-name`s). */
  insertActions(): void {
    insertActionGroup(this.parts.root, "win", this.actionGroup);
  }

  async askUnsavedChanges(): Promise<UnsavedChangesAnswer> {
    const response = await this.parts.unsavedChangesDialog.present();
    return response === "save" || response === "discard" ? response : "cancel";
  }

  closeWindow(): void {
    Application.android?.foregroundActivity?.finish();
  }

  private onStackChanged(name: string): void {
    const page = STACK_PAGES.find((candidate) => candidate.id === name);
    if (!page || this.isDesktopLayout()) return;
    if (name !== this.currentName) {
      if (this.currentName) this.screens[this.currentName as keyof Screens].onHide?.();
      this.screens[page.id].onShow?.();
      this.currentName = name;
    }
    const previous = this.current;
    this.current = page.view;
    this.onViewChanged?.(page.view, previous);
  }

  /** Detach a screen from whichever container holds it, ready for the other layout. */
  private detach(view: View): void {
    const parent = view.parent as unknown as { remove?: (child: View) => unknown; removeChild?: (v: View) => void };
    if (!parent) return;
    if (parent === (this.parts.stack as unknown)) this.parts.stack.remove(view);
    else if (typeof parent.remove === "function") parent.remove(view);
    else parent.removeChild?.(view);
  }

  private mountSingleLayout(): void {
    const { stack, switcherBar } = this.parts;
    const keep = this.currentName ?? STACK_PAGES[1]!.id;
    for (const page of STACK_PAGES) this.detach(this.screens[page.id].view);
    for (const page of STACK_PAGES) stack.add(this.screens[page.id].view, page.id, page.title(), page.icon);
    switcherBar.set_stack(stack);
    this.padColumnsForSystemInsets(false);
    this.currentName = null;
    stack.visibleChildName = keep;
    this.onStackChanged(stack.visibleChildName);
  }

  private mountThreeColumnLayout(): void {
    const { screens } = this;
    for (const page of STACK_PAGES) this.detach(screens[page.id].view);
    // A box hands spare space only to a child that asks for it, and the screens are plain views.
    for (const page of STACK_PAGES) Object.assign(screens[page.id].view, { hexpand: true, vexpand: true });
    this.parts.leftColumn.append(screens.learn.view);
    this.parts.centerColumn.append(screens.editor.view);
    this.parts.rightTopBox.append(screens.gameConsole.view);
    this.parts.rightBottomBox.append(screens.debugger.view);
    // No bottom bar in columns; the screens are all on show.
    this.parts.switcherBar.set_stack(null);
    this.padColumnsForSystemInsets(true);
    this.currentName = null;
    for (const page of STACK_PAGES) screens[page.id].onShow?.();
    this.current = ViewType.EDITOR;
    mainStateController.setViewType(ViewType.EDITOR);
  }

  /**
   * The columns run down to the screen's bottom edge, behind the gesture area, with their
   * backgrounds. What scrolls in them (and the editor's Help bar) clears it instead of the
   * columns being shortened. In the stack the switcher bar below pays it, so nothing does here.
   */
  private padColumnsForSystemInsets(on: boolean): void {
    this.releaseColumnInsets?.();
    this.releaseColumnInsets = on ? padForSystemInsets(this.parts.rightColumnContent) : null;
    for (const page of STACK_PAGES) this.screens[page.id].padSystemInsets?.(on);
  }
}
