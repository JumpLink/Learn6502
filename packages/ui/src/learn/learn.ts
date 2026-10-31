import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import type Gtk from "@girs/gtk-4.0";
import GLib from "@girs/glib-2.0";
import { EventDispatcher } from "@learn6502/core";
import type { LearnView } from "../views/index.ts";
import type { LearnViewEventMap } from "../types/index.ts";
import { learnController } from "../controller/index.ts";

import type { ExamplesList } from "./examples-list.ts";
import { TutorialView } from "../mdx/index.ts";

import Template from "./learn.blp?template";

const MAIN_PAGE = "main";

/**
 * @class Learn, the landing page that opens the tutorial and the examples
 * Implements LearnView
 *
 * The tutorial page starts EMPTY and gets its `TutorialView` on the first visit, as the examples
 * list is populated on its first visit: the generated tutorial is a few hundred widgets, and a page
 * nobody opens should cost nothing. `TutorialView` is the shared one from `../mdx/`, built from the
 * same generated Blueprint on all three platforms, and it hands the tutorial's code to
 * `learnController` exactly as the examples do here.
 *
 * @emits subpage-changed - A page was opened or closed, so the shell can show a back button
 * @emits share - The user asked to share their own example
 */
export class Learn extends Adw.Bin implements LearnView {
  readonly events = new EventDispatcher<LearnViewEventMap>();

  // Child widgets
  declare private _navigationView: Adw.NavigationView;
  declare private _tutorialRow: Adw.ActionRow;
  declare private _examplesRow: Adw.ActionRow;
  declare private _tutorialScroll: Gtk.ScrolledWindow;
  declare private _tutorialHost: Adw.Bin;
  declare private _examplesScroll: Gtk.ScrolledWindow;
  declare private _examplesList: ExamplesList;
  declare private _shareButton: Gtk.Button;

  // Store the scroll position
  private _lastScrollPosition: number = 0;

  static {
    GObject.registerClass(
      {
        GTypeName: "Learn",
        Template,
        InternalChildren: [
          "navigationView",
          "tutorialRow",
          "examplesRow",
          "tutorialScroll",
          "tutorialHost",
          "examplesScroll",
          "examplesList",
          "shareButton",
        ],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps> = {}) {
    super(params);

    this._tutorialRow.connect("activated", () => this._navigationView.push_by_tag("tutorial"));
    this._examplesRow.connect("activated", () => this._navigationView.push_by_tag("examples"));
    this._shareButton.connect("clicked", () => this.events.dispatch("share", {}));

    this._examplesList.events.on("copy", this.onExampleCopy);
    this._navigationView.connect("notify::visible-page", this.onVisiblePageChanged);
  }

  private onExampleCopy = (event: { code: string }): void => {
    learnController.dispatch("copy", event);
  };

  private onVisiblePageChanged = (): void => {
    const tag = this._navigationView.get_visible_page_tag();
    // The cards and the tutorial are built on first visit: a page nobody opens costs nothing
    if (tag === "examples") this._examplesList.populate();
    if (tag === "tutorial" && this._tutorialHost.get_child() === null) {
      const view = new TutorialView();
      // Below the first screen nothing is on show yet, so it does not have to be laid out
      // before the page appears: `MdxView` reveals the rest once the view is mapped.
      view.deferBelowFold();
      this._tutorialHost.set_child(view);
    }
    this.events.dispatch("subpage-changed", { hasSubpage: this.hasVisibleSubpage, tag });
  };

  get hasVisibleSubpage(): boolean {
    const visiblePageTag = this._navigationView.get_visible_page_tag();
    // Show back button when we're not on the main page
    return visiblePageTag !== MAIN_PAGE && visiblePageTag !== null;
  }

  public navigateBack(): void {
    this._navigationView.pop();
  }

  /** The scrollers of the tutorial and examples pages, for platform glue such as system insets. */
  public get scrolledWindows(): Gtk.ScrolledWindow[] {
    return [this._tutorialScroll, this._examplesScroll];
  }

  /** Scroller of the page that is visible, if it scrolls. */
  private getScrolledWindow(): Gtk.ScrolledWindow | null {
    switch (this._navigationView.get_visible_page_tag()) {
      case "tutorial":
        return this._tutorialScroll;
      case "examples":
        return this._examplesScroll;
      default:
        return null;
    }
  }

  // Save the current scroll position
  public saveScrollPosition(): void {
    const scrolledWindow = this.getScrolledWindow();
    if (!scrolledWindow) return;

    const vadjustment = scrolledWindow.get_vadjustment();

    // Check if adjustment is valid and scrollable content exists
    if (vadjustment && vadjustment.get_upper() > vadjustment.get_page_size()) {
      this._lastScrollPosition = vadjustment.get_value();
    }
  }

  // Restore the previously saved scroll position
  public restoreScrollPosition(): void {
    // Use GLib.idle_add to ensure the adjustment is properly initialized
    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      const scrolledWindow = this.getScrolledWindow();
      if (!scrolledWindow) return GLib.SOURCE_REMOVE;

      const vadjustment = scrolledWindow.get_vadjustment();

      // Check if adjustment is valid and scrollable content exists
      if (
        vadjustment &&
        vadjustment.get_upper() > vadjustment.get_page_size() &&
        this._lastScrollPosition > 0 &&
        this._lastScrollPosition <= vadjustment.get_upper() - vadjustment.get_page_size()
      ) {
        vadjustment.set_value(this._lastScrollPosition);
      }

      return GLib.SOURCE_REMOVE; // Remove the source after execution
    });
  }
}

GObject.type_ensure(Learn.$gtype);
