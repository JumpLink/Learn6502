import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GLib from "@girs/glib-2.0";

import { TutorialView } from "../../mdx/tutorial-view.ts";

import Template from "./learn.blp";
import type { LearnView, LearnEventMap } from "@learn6502/common-ui";
import { EventDispatcher } from "@learn6502/6502";

export class Learn extends Adw.Bin implements LearnView {
  readonly events = new EventDispatcher<LearnEventMap>();

  // Child widgets
  declare private _statusPage: Adw.StatusPage;
  declare private _tutorialView: TutorialView;

  // Store the scroll position
  private _lastScrollPosition: number = 0;

  static {
    GObject.registerClass(
      {
        GTypeName: "Learn",
        Template,
        InternalChildren: ["statusPage", "tutorialView"],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
    this.setupTutorialSignalListeners();
  }

  private setupTutorialSignalListeners(): void {
    this._tutorialView.connect("copy", (tutorialView, code) => {
      this.events.dispatch("copy", { code });
    });
  }

  private getScrolledWindow(): Gtk.ScrolledWindow {
    const scrolledWindow =
      this._statusPage.get_first_child() as Gtk.ScrolledWindow;
    if (!scrolledWindow) {
      throw new Error("ScrolledWindow not initialized");
    }
    return scrolledWindow;
  }

  // Save the current scroll position
  public saveScrollPosition(): void {
    const scrolledWindow = this.getScrolledWindow();
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
      const vadjustment = scrolledWindow.get_vadjustment();

      // Check if adjustment is valid and scrollable content exists
      if (
        vadjustment &&
        vadjustment.get_upper() > vadjustment.get_page_size() &&
        this._lastScrollPosition > 0 &&
        this._lastScrollPosition <=
          vadjustment.get_upper() - vadjustment.get_page_size()
      ) {
        vadjustment.set_value(this._lastScrollPosition);
      }

      return GLib.SOURCE_REMOVE; // Remove the source after execution
    });
  }
}

GObject.type_ensure(Learn.$gtype);
