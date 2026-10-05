import { GtkSource } from "@gjsify/gtksource-nativescript";
// The same GtkSourceView data files the GNOME app compiles into its gresource.
import sixAssemblerLang from "../../../app-gnome/data/lang-specs/6502-assembler.lang?raw";
import hexLang from "../../../app-gnome/data/lang-specs/hex.lang?raw";
import learnStyle from "../../../app-gnome/data/schemas/learn6502-style.xml?raw";
import learnStyleDark from "../../../app-gnome/data/schemas/learn6502-style-dark.xml?raw";

let registered = false;

/** Register the 6502 languages and the Learn6502 schemes once (idempotent). */
export function registerGtkSourceData(): void {
  if (registered) return;
  registered = true;
  const languages = GtkSource.LanguageManager.getDefault();
  languages.addLanguageFromXml(sixAssemblerLang);
  languages.addLanguageFromXml(hexLang);
  const schemes = GtkSource.StyleSchemeManager.getDefault();
  schemes.addSchemeFromXml(learnStyle);
  schemes.addSchemeFromXml(learnStyleDark);
}
