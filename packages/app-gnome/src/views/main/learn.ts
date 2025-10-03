import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GLib from "@girs/glib-2.0";

import { TutorialView } from "../../mdx/tutorial-view.ts";

import Template from "./learn.blp";
import type { LearnView } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";

export class Learn extends Adw.Bin implements LearnView {
  // Child widgets
  declare private _navigationView: Adw.NavigationView;
  declare private _navigationList: Gtk.ListBox;
  declare private _tutorialRow: Adw.ActionRow;
  declare private _examplesRow: Adw.ActionRow;
  declare private _statusPage: Adw.StatusPage;
  declare private _tutorialView: TutorialView;
  declare private _examplesStatusPage: Adw.StatusPage;
  declare private _placeholderBox: Gtk.Box;

  // Store the scroll position
  private _lastScrollPosition: number = 0;

  static {
    GObject.registerClass(
      {
        GTypeName: "Learn",
        Template,
        Properties: {
          "show-back-button": GObject.ParamSpec.boolean(
            "show-back-button",
            "Show Back Button",
            "Whether the back button should be shown in the header bar",
            GObject.ParamFlags.READABLE,
            false
          ),
        },
        InternalChildren: [
          "navigationView",
          "navigationList",
          "tutorialRow",
          "examplesRow",
          "statusPage",
          "tutorialView",
          "examplesStatusPage",
          "placeholderBox",
        ],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
    this.setupTutorialSignalListeners();
    this.setupNavigationListeners();
  }

  private setupNavigationListeners(): void {
    // Listen to navigation stack changes to update back button visibility
    this._navigationView.connect("notify::visible-page", () => {
      this.notify("show-back-button");
    });
  }

  get show_back_button(): boolean {
    const visiblePageTag = this._navigationView.get_visible_page_tag();
    // Show back button when we're not on the main page
    return visiblePageTag !== "main" && visiblePageTag !== null;
  }

  public navigateBack(): void {
    this._navigationView.pop();
  }

  private setupTutorialSignalListeners(): void {
    this._tutorialView.connect("copy", (tutorialView, code) => {
      // Dispatch copy event through controller
      learnController.dispatch("copy", { code });
    });
  }

  private getScrolledWindow(): Gtk.ScrolledWindow | null {
    // ScrolledWindow is created by Adw.StatusPage
    const scrolledWindow =
      this._statusPage.get_first_child() as Gtk.ScrolledWindow;
    return scrolledWindow || null;
  }

  // Save the current scroll position
  public saveScrollPosition(): void {
    const scrolledWindow = this.getScrolledWindow();
    if (!scrolledWindow) return;

    const vadjustment = scrolledWindow.get_vadjustment();

    // Check if adjustment is valid and scrollable content exists
    if (vadjustment && vadjustment.get_upper() > vadjustment.get_page_size()) {
      this._lastScrollPosition = vadjustment.get_value();

      // Optionally update the controller if we want to share scroll position
      // between platform views
      // learnController.saveScrollPosition(this._lastScrollPosition);
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
