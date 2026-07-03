/**
 * Applies the shell layout stylesheet (`./styles.css`).
 *
 * The CSS is authored in a real `.css` file and imported as a string via
 * gjsify's css-as-string (identical under Vite dev with
 * `gjsifyBrowser({ cssAsString: true })` and a `gjsify build --app browser`
 * bundle) — the same author-once pattern the native app-gnome uses
 * (`import mainCss from './main.css'` → `Gtk.CssProvider.load_from_string`).
 * The browser applies the string through a one-shot `<style>` element.
 */

import shellCss from "./styles.css";

let injected = false;

/** Inject the shell layout stylesheet once (idempotent, browser-only). */
export function injectShellStyles(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  if (document.getElementById("learn6502-shell-style")) return;
  const style = document.createElement("style");
  style.id = "learn6502-shell-style";
  style.textContent = shellCss;
  document.head.appendChild(style);
}
