import { localize as _ } from "@nativescript/localize";
import { Adw, Gtk, MENU_ITEM_ACTIVATED } from "@gjsify/adwaita-nativescript";
import { registerTemplateClass } from "@gjsify/adwaita-nativescript/builder";
import { openMenuSymbolic } from "@gjsify/adwaita-icons/actions";

/**
 * The app menu, in the header bar. The GNOME app's `$MenuButton` is a Blueprint whose `menu` root
 * the shared tree does not carry yet, so the entries are written here. `onActivated` receives the
 * id of the chosen entry.
 */
export class MenuButton extends Adw.Bin {
  public onActivated: ((id: string) => void) | null = null;

  constructor() {
    super();
    const button = new Gtk.MenuButton();
    button.iconName = openMenuSymbolic;
    button.menuTitle = "Learn6502";
    button.menuModel = [
      { id: "about", label: _("About Learn 6502 Assembly") },
      { id: "help", label: _("Help") },
      { id: "quit", label: _("Quit") },
    ];
    button.addEventListener(MENU_ITEM_ACTIVATED, (event) => {
      this.onActivated?.((event as unknown as { id: string }).id);
    });
    this.set_child(button as never);
  }
}

registerTemplateClass("MenuButton", MenuButton);
