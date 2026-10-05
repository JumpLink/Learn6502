/**
 * Self-injects the GameConsole view's stylesheet (`./styles.css`) on import —
 * the same pattern the Learn/Editor views and the debugger widgets use. The CSS
 * is authored in a real `.css` file and imported as a string via gjsify's
 * css-as-string.
 */

import gameConsoleCss from "./styles.css";

if (typeof document !== "undefined" && !document.getElementById("learn-game-console-style")) {
  const style = document.createElement("style");
  style.id = "learn-game-console-style";
  style.textContent = gameConsoleCss;
  document.head.appendChild(style);
}
