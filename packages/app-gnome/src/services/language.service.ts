import GLib from "@girs/glib-2.0";
import { settings } from "../settings.ts";
import { APPLICATION_ID, DATADIR } from "../constants.ts";

import GObject from "@girs/gobject-2.0";
import gettext from "gettext";

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
}

// Available languages from LINGUAS file
export const AVAILABLE_LANGUAGES: LanguageInfo[] = [
  { code: "system", name: _("System Default"), nativeName: "System Default" },
  { code: "de", name: _("German"), nativeName: "Deutsch" },
  { code: "en", name: _("English"), nativeName: "English" },
  { code: "es", name: _("Spanish"), nativeName: "Español" },
  { code: "fr", name: _("French"), nativeName: "Français" },
  { code: "ia", name: _("Interlingua"), nativeName: "Interlingua" },
  { code: "ja", name: _("Japanese"), nativeName: "日本語" },
  { code: "nl", name: _("Dutch"), nativeName: "Nederlands" },
  { code: "pt", name: _("Portuguese"), nativeName: "Português" },
  {
    code: "pt_BR",
    name: _("Portuguese (Brazil)"),
    nativeName: "Português (Brasil)",
  },
  { code: "uk", name: _("Ukrainian"), nativeName: "Українська" },
  { code: "zh_Hans", name: _("Chinese (Simplified)"), nativeName: "简体中文" },
];

class LanguageService extends GObject.Object {
  private currentLanguage: string;

  static {
    GObject.registerClass(
      {
        GTypeName: "LanguageService",
        Signals: {
          "language-changed": {
            param_types: [GObject.TYPE_STRING],
          },
        },
      },
      this
    );
  }

  constructor() {
    super();
    this.currentLanguage = settings.get_string("language");
  }

  public init(): void {
    const savedLanguage = settings.get_string("language");
    this.applyLanguage(savedLanguage);

    // Watch for language changes
    settings.connect("changed::language", () => {
      const newLanguage = settings.get_string("language");
      if (newLanguage !== this.currentLanguage) {
        this.applyLanguage(newLanguage);
      }
    });
  }

  public getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  public setLanguage(languageCode: string): void {
    if (languageCode === this.currentLanguage) {
      return;
    }

    settings.set_string("language", languageCode);
    this.applyLanguage(languageCode);
  }

  private applyLanguage(languageCode: string): void {
    this.currentLanguage = languageCode;

    if (languageCode === "system") {
      // Reset to system default
      GLib.unsetenv("LANGUAGE");
      GLib.unsetenv("LC_ALL");
      GLib.unsetenv("LC_MESSAGES");
    } else {
      // Set the language environment variables
      // LANGUAGE is used by gettext for message catalogs
      GLib.setenv("LANGUAGE", languageCode, true);
      GLib.setenv("LC_ALL", `${languageCode}.UTF-8`, true);
      GLib.setenv("LC_MESSAGES", `${languageCode}.UTF-8`, true);
    }

    // Call setlocale through the native gettext bindings
    // This is essential for gettext to pick up the new language
    try {
      const localeString =
        languageCode === "system" ? "" : `${languageCode}.UTF-8`;
      gettext.setlocale(6, localeString); // 6 = LC_ALL
    } catch (e) {
      console.warn(`Failed to set locale to ${languageCode}:`, e);
      // Continue even if setlocale fails - environment variables may be enough
    }

    // Rebind text domain to ensure translations are reloaded
    // This forces gettext to reload the message catalog
    gettext.bindtextdomain(APPLICATION_ID, `${DATADIR}/locale`);
    gettext.textdomain(APPLICATION_ID);

    log(`Language changed to: ${languageCode}`);

    // Emit signal to notify UI components about language change
    this.emit("language-changed", languageCode);
  }

  public getAvailableLanguages(): LanguageInfo[] {
    return AVAILABLE_LANGUAGES;
  }

  public getLanguageInfo(code: string): LanguageInfo | undefined {
    return AVAILABLE_LANGUAGES.find((lang) => lang.code === code);
  }
}

export const languageService = new LanguageService();
