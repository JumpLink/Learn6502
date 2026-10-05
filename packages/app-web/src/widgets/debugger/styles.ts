/**
 * Self-injects the debugger widgets' stylesheet (`./styles.css`) on import —
 * a single side-effect import styles all debugger widgets, the same pattern
 * `@gjsify/adwaita-web` uses for its own skin. The CSS is authored in a real
 * `.css` file and imported as a string via gjsify's css-as-string.
 */

import debuggerCss from "./styles.css";

if (typeof document !== "undefined" && !document.getElementById("learn-debugger-style")) {
  const style = document.createElement("style");
  style.id = "learn-debugger-style";
  style.textContent = debuggerCss;
  document.head.appendChild(style);
}
