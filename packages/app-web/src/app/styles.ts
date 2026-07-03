/**
 * Self-injected layout stylesheet for the app-web Adwaita SPA shell.
 *
 * Only the app-level LAYOUT lives here (full-viewport frame, the adaptive
 * single/three-column arrangement, run-control spacing). Every widget's own
 * look comes from the `@gjsify/adwaita-web` skin, which self-injects on import.
 *
 * Injected via a `<style>` element (the same pattern adwaita-web and the
 * debugger widgets use) so it works identically under Vite dev and a
 * `gjsify build --app browser` bundle — no `.css` import to route through a
 * bundler's CSS pipeline.
 */

const SHELL_CSS = /* css */ `
html,
body {
  margin: 0;
  height: 100%;
}

body {
  background: var(--window-bg-color, #fafafb);
  color: var(--window-fg-color, rgb(0 0 6 / 80%));
  font-family: "Adwaita Sans", "Cantarell", sans-serif;
}

#application-window {
  display: block;
  width: 100%;
  height: 100vh;
  height: 100dvh;
}

#application-window > adw-toolbar-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

#application-window .adw-toolbar-view-content {
  flex: 1 1 auto;
  min-height: 0;
}

/* The toast overlay + its content wrapper + layout host fill the content area. */
#application-window adw-toast-overlay,
#application-window .adw-toast-overlay-content,
#layout-host {
  display: block;
  height: 100%;
  min-height: 0;
}

#layout-host {
  position: relative;
}

#mobile-layout,
#desktop-layout {
  height: 100%;
  min-height: 0;
}

/* --- Mobile: single ViewStack, one page visible at a time --- */
#mobile-layout {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

#mobile-layout adw-view-stack {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
}

/* --- Desktop: Learn sidebar | Editor | (GameConsole over Debugger) --- */
#desktop-layout {
  display: flex;
}

#desktop-layout adw-overlay-split-view {
  flex: 1 1 auto;
  min-height: 0;
}

.shell-center-right {
  display: flex;
  flex-direction: row;
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
}

.shell-center-column {
  flex: 1 1 auto;
  min-width: 0;
  overflow: auto;
  padding: 12px;
}

.shell-right-column {
  flex: 0 0 340px;
  width: 340px;
  overflow-y: auto;
  overflow-x: hidden;
  border-inline-start: 1px solid var(--border-color, rgb(0 0 0 / 12%));
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.shell-sidebar-column {
  height: 100%;
  overflow: auto;
  padding: 12px;
  box-sizing: border-box;
}

/* Each view fills its host slot. */
.shell-view-slot {
  display: block;
  height: 100%;
  min-height: 0;
}

/* Header run controls sit in a tight linked-ish group. */
.shell-run-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-inline-start: 6px;
}

/* Placeholder status pages breathe inside their column. */
.shell-view-slot adw-status-page {
  display: flex;
  height: 100%;
}
`;

let injected = false;

/** Inject the shell layout stylesheet once (idempotent, browser-only). */
export function injectShellStyles(): void {
  if (injected || typeof document === "undefined") return;
  injected = true;
  if (document.getElementById("learn6502-shell-style")) return;
  const style = document.createElement("style");
  style.id = "learn6502-shell-style";
  style.textContent = SHELL_CSS;
  document.head.appendChild(style);
}
