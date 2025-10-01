import GLib from "@girs/glib-2.0";
import { settings } from "../settings.ts";
import { APPLICATION_ID } from "../constants.ts";
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

class LanguageService {
  private currentLanguage: string;

  constructor() {
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
    } else {
      // Set the language environment variable
      // Note: In GJS, changing environment variables affects the current process
      GLib.setenv("LANGUAGE", languageCode, true);
      GLib.setenv("LC_ALL", `${languageCode}.UTF-8`, true);
    }

    // Reinitialize gettext to apply the language change
    gettext.textdomain(APPLICATION_ID);

    log(`Language changed to: ${languageCode}`);
  }

  public getAvailableLanguages(): LanguageInfo[] {
    return AVAILABLE_LANGUAGES;
  }

  public getLanguageInfo(code: string): LanguageInfo | undefined {
    return AVAILABLE_LANGUAGES.find((lang) => lang.code === code);
  }
}

export const languageService = new LanguageService();
