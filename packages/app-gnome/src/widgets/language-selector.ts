import GObject from "@girs/gobject-2.0";
import Gtk from "@girs/gtk-4.0";
import Gio from "@girs/gio-2.0";
import GLib from "@girs/glib-2.0";
import Adw from "@girs/adw-1";

import Template from "./language-selector.blp";
import ListItemTemplate from "./language-list-item.blp";
import { LanguageItem } from "./language-item.ts";
import {
  languageService,
  AVAILABLE_LANGUAGES,
  notificationService,
} from "../services";

/**
 * Language selector widget using Adw.ComboRow
 * Displays available languages with custom formatting
 */
export class LanguageSelector extends Adw.ComboRow {
  private listStore!: Gio.ListStore;

  static {
    GObject.registerClass(
      {
        GTypeName: "LanguageSelector",
        Template,
      },
      this
    );
  }

  constructor(params: Partial<Adw.ComboRow.ConstructorProps> = {}) {
    super(params);
    this.setupLanguageList();
    this.setupListFactory();
    this.connectSignals();
  }

  private setupLanguageList(): void {
    // Create list store with LanguageItem objects
    this.listStore = new Gio.ListStore({
      item_type: LanguageItem.$gtype,
    });

    // Populate with language items
    AVAILABLE_LANGUAGES.forEach((lang) => {
      const item = new LanguageItem({
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
      });
      this.listStore.append(item);
    });

    this.set_model(this.listStore);

    // Set current selection
    const currentLanguage = languageService.getCurrentLanguage();
    const currentIndex = AVAILABLE_LANGUAGES.findIndex(
      (lang) => lang.code === currentLanguage
    );
    if (currentIndex !== -1) {
      this.set_selected(currentIndex);
    }
  }

  private setupListFactory(): void {
    // Create factory from compiled Blueprint template
    const templateBytes = new TextEncoder().encode(ListItemTemplate);
    const bytes = new GLib.Bytes(templateBytes);
    const factory = Gtk.BuilderListItemFactory.new_from_bytes(null, bytes);
    this.set_list_factory(factory);

    // Use simple expression for the selected item display
    const expression = Gtk.PropertyExpression.new(
      LanguageItem.$gtype,
      null,
      "native-name"
    );
    this.set_expression(expression);
  }

  private connectSignals(): void {
    this.connect("notify::selected", () => {
      this.onLanguageChanged();
    });
  }

  private onLanguageChanged(): void {
    const selectedIndex = this.get_selected();
    const selectedLanguage = AVAILABLE_LANGUAGES[selectedIndex];

    if (!selectedLanguage) {
      return;
    }

    const currentLanguage = languageService.getCurrentLanguage();
    if (selectedLanguage.code === currentLanguage) {
      return;
    }

    languageService.setLanguage(selectedLanguage.code);

    // Show notification using the notification service
    notificationService.info(
      // TRANSLATORS: Notification shown after changing language
      _(
        "Please restart the application for the language change to take effect."
      )
    );
  }
}

GObject.type_ensure(LanguageSelector.$gtype);
