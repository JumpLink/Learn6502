/**
 * Self-injects the Editor view's stylesheet (`./styles.css`) on import — the
 * same pattern the Learn view (`widgets/learn/styles.ts`) and the debugger
 * widgets use. The CSS is authored in a real `.css` file and imported as a
 * string via gjsify's css-as-string.
 */

import editorCss from "./styles.css";

if (typeof document !== "undefined" && !document.getElementById("learn-editor-style")) {
  const style = document.createElement("style");
  style.id = "learn-editor-style";
  style.textContent = editorCss;
  document.head.appendChild(style);
}
