/**
 * Shared stylesheet for the common-ui debugger widgets (ADR 0007 spike).
 * Self-injected on import — the same pattern `@gjsify/adwaita-web` uses for
 * its own skin, so a single side-effect import styles all debugger widgets.
 * Only spike-specific chrome lives here (code blocks, copy button, flag grid);
 * everything else comes from the adwaita-web skin.
 */

const DEBUGGER_CSS = /* css */ `
learn-debugger {
  display: block;
}

learn-debugger .learn-section-heading {
  display: block;
  font-weight: bold;
  margin: 18px 0 8px;
}

learn-debugger .learn-code-card {
  position: relative;
  display: block;
  padding: 10px 14px;
}

learn-debugger .learn-code-card pre {
  margin: 0;
  max-height: 240px;
  overflow: auto;
  font-family: ui-monospace, "Adwaita Mono", monospace;
  font-size: 0.85em;
  line-height: 1.45;
  white-space: pre;
}

learn-debugger .learn-copy-button {
  position: absolute;
  top: 6px;
  right: 6px;
}

learn-debugger .learn-register-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: ui-monospace, "Adwaita Mono", monospace;
}

learn-debugger .learn-register-value .learn-register-dec {
  opacity: 0.55;
  font-size: 0.8em;
}

learn-debugger .learn-flags-grid {
  display: grid;
  grid-template-columns: repeat(8, 1.2em);
  justify-items: center;
  font-family: ui-monospace, "Adwaita Mono", monospace;
}

learn-debugger .learn-flags-grid .learn-flag-header {
  opacity: 0.55;
  font-size: 0.8em;
}

learn-debugger .learn-flag-off {
  opacity: 0.4;
}
`;

if (typeof document !== "undefined" && !document.getElementById("learn-debugger-style")) {
  const style = document.createElement("style");
  style.id = "learn-debugger-style";
  style.textContent = DEBUGGER_CSS;
  document.head.appendChild(style);
}
