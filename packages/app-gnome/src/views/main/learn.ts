import GObject from "@girs/gobject-2.0";
import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import GLib from "@girs/glib-2.0";

import { TutorialView } from "../../mdx/tutorial-view.ts";
import { ExamplesList } from "../../widgets/examples-list.ts";

import Template from "./learn.blp";
import type { LearnView } from "@learn6502/common-ui";
import { learnController } from "@learn6502/common-ui/src/controller";

export class Learn extends Adw.Bin implements LearnView {
  // Child widgets
  private declare _navigationView: Adw.NavigationView;
  private declare _navigationList: Gtk.ListBox;
  private declare _tutorialRow: Adw.ActionRow;
  private declare _examplesRow: Adw.ActionRow;
  private declare _statusPage: Adw.StatusPage;
  private declare _tutorialView: TutorialView;
  private declare _examplesStatusPage: Adw.StatusPage;
  private declare _examplesList: ExamplesList;

  // Store the scroll position
  private _lastScrollPosition: number = 0;

  static {
    GObject.registerClass(
      {
        GTypeName: "Learn",
        Template,
        Properties: {
          hasVisibleSubpage: GObject.ParamSpec.boolean(
            "hasVisibleSubpage",
            "Has Visible Subpage",
            "Whether the Learn view has opened a visible subpage",
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
          "examplesList",
        ],
      },
      this
    );
  }

  constructor(params: Partial<Adw.Bin.ConstructorProps>) {
    super(params);
    this.setupTutorialSignalListeners();
    this.setupNavigationListeners();
    this.setupExamplesSignalListeners();
  }

  private setupNavigationListeners(): void {
    // Listen to navigation stack changes to update hasVisibleSubpage property
    this._navigationView.connect("notify::visible-page", () => {
      this.notify("hasVisibleSubpage");
    });
  }

  get hasVisibleSubpage(): boolean {
    const visiblePageTag = this._navigationView.get_visible_page_tag();
    // Show back button when we're not on the main tutorial page
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

  private setupExamplesSignalListeners(): void {
    this._examplesList.connect("copy-code", (_examplesList, code) => {
      // Dispatch copy event to load example code into editor
      learnController.dispatch("copy", { code });
    });
  }

  private getScrolledWindow(): Gtk.ScrolledWindow | null {
    // ScrolledWindow is created by Adw.StatusPage
    const scrolledWindow = this._statusPage.get_first_child() as Gtk.ScrolledWindow;
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
        this._lastScrollPosition <= vadjustment.get_upper() - vadjustment.get_page_size()
      ) {
        vadjustment.set_value(this._lastScrollPosition);
      }

      return GLib.SOURCE_REMOVE; // Remove the source after execution
    });
  }
}

GObject.type_ensure(Learn.$gtype);
