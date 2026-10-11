import GtkSource from "@girs/gtksource-5";

import sixAssemblerLang from "../data/lang-specs/6502-assembler.lang";
import hexLang from "../data/lang-specs/hex.lang";
import learnStyle from "../data/styles/learn6502-style.xml";
import learnStyleDark from "../data/styles/learn6502-style-dark.xml";

// The browser and NativeScript ports have no gresource and no search path: they take the
// XML directly through these two additions to the GtkSource managers.
interface XmlRegistry {
  addLanguageFromXml?(xml: string): unknown;
  addSchemeFromXml?(xml: string): unknown;
}

let registered = false;

/**
 * Register the 6502 languages and the Learn6502 style schemes where there is no gresource.
 *
 * On GNOME the managers have neither method and `resources.ts` points their search paths
 * into the gresource, so this does nothing there.
 */
export function registerSourceViewData(): void {
  if (registered) return;
  registered = true;
  const languages = GtkSource.LanguageManager.get_default() as unknown as XmlRegistry;
  languages.addLanguageFromXml?.(sixAssemblerLang);
  languages.addLanguageFromXml?.(hexLang);
  const schemes = GtkSource.StyleSchemeManager.get_default() as unknown as XmlRegistry;
  schemes.addSchemeFromXml?.(learnStyle);
  schemes.addSchemeFromXml?.(learnStyleDark);
}
