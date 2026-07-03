/**
 * Self-injects the Learn view's stylesheet (`./styles.css`) on import — the
 * same pattern `@gjsify/adwaita-web` and the debugger widgets
 * (`widgets/debugger/styles.ts`) use. The CSS is authored in a real `.css`
 * file and imported as a string via gjsify's css-as-string.
 */

import learnCss from "./styles.css";

if (typeof document !== "undefined" && !document.getElementById("learn-view-style")) {
  const style = document.createElement("style");
  style.id = "learn-view-style";
  style.textContent = learnCss;
  document.head.appendChild(style);
}
