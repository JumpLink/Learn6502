export type Translator = (msgid: string) => string;

let translator: Translator | null = null;

/**
 * Let a platform that has no global `_` (Android) say how a msgid is translated.
 * The call sites stay literal `_("…")` so xgettext still finds them.
 */
export function setTranslator(fn: Translator): void {
  translator = fn;
}

/** The GJS global `_` where there is one; the msgid itself on the English-only web. */
export function _(msgid: string): string {
  if (translator) return translator(msgid);
  const global = (globalThis as { _?: Translator })._;
  return global ? global(msgid) : msgid;
}

export type LanguageSource = () => string;

let languageSource: LanguageSource | null = null;

/**
 * Let a platform whose engine carries no `Intl` say what the UI language is. NativeScript's V8 is
 * built without ICU, so `Intl` is simply absent there and reading it throws a ReferenceError.
 */
export function setLanguageSource(fn: LanguageSource): void {
  languageSource = fn;
}

/** The UI language as a BCP 47 tag (`de`, `de-DE`, …), empty where no platform can say. */
export function uiLanguage(): string {
  if (languageSource) return languageSource();
  return typeof Intl === "undefined" ? "" : new Intl.DateTimeFormat().resolvedOptions().locale;
}
