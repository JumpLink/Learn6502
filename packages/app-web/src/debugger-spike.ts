/**
 * ADR 0007 spike demo page — drives the `AdwDebuggerView` through the SAME
 * common-ui pipeline the GNOME and Android apps use:
 *
 *   core events → gameConsoleController → GameConsoleEventBridge (shared)
 *     → AdwDebuggerView → debuggerController → widgets
 *
 * No controller logic is re-implemented here: the page only builds the demo
 * chrome (program editor + toolbar) and forwards button clicks to
 * `gameConsoleController`, exactly like the twins' main views.
 *
 * Dev-only — not linked from the Jekyll site. Open via:
 *   npx vite            → http://localhost:5173/debugger-spike.html
 *   npx vite preview    → after `gjsify run build`
 */

import "@gjsify/adwaita-web";
import { AdwButton, AdwHeaderBar, AdwToastOverlay, AdwWindowTitle } from "@gjsify/adwaita-web";
import { DebuggerState, GameConsoleEventBridge, debuggerController, gameConsoleController } from "@learn6502/common-ui";
import { Assembler, Labels, Memory, Simulator, formatMessage } from "@learn6502/core";

import { AdwDebuggerView } from "./views/adw-debugger.js";

/** Notification key → toast title (the GNOME twin's NOTIFICATION_TITLES, English only). */
const NOTIFICATION_TITLES: Record<string, string> = {
  "assembled-successfully": "Assembled successfully",
  "assemble-failed": "Assemble failed",
  "simulator-failure": "Simulator failure",
  "labels-failure": "Labels failure",
  "program-completed": "Program completed",
};

const DEMO_PROGRAM = `; Fill the display page at $0200 with random colors.
; Select the "Display Memory" region in the hex monitor
; to watch the writes happen.
  LDX #$00
loop:
  LDA $fe        ; random byte
  STA $0200,X
  INX
  BNE loop
  BRK
`;

// --- Core setup (what GameConsole does on every platform) ---
const memory = new Memory();
const labels = new Labels();
const simulator = new Simulator(memory, labels);
const assembler = new Assembler(memory, labels);

// --- Page chrome ---
const overlay = new AdwToastOverlay();

const headerBar = new AdwHeaderBar();
const windowTitle = new AdwWindowTitle();
windowTitle.setAttribute("slot", "center");
windowTitle.setAttribute("title", "DebuggerView spike");
windowTitle.setAttribute("subtitle", "common-ui × adwaita-web (ADR 0007)");
headerBar.appendChild(windowTitle);

const main = document.createElement("main");

const editor = document.createElement("textarea");
editor.className = "learn-spike-editor";
editor.spellcheck = false;
editor.value = DEMO_PROGRAM;

const toolbar = document.createElement("div");
toolbar.className = "learn-spike-toolbar";

const stateLabel = document.createElement("span");
stateLabel.className = "learn-spike-state";
stateLabel.textContent = simulator.state;

function toolbarButton(label: string, onClick: () => void, suggested = false): AdwButton {
  const button = new AdwButton();
  button.setAttribute("label", label);
  if (suggested) button.setAttribute("suggested", "");
  button.addEventListener("click", onClick);
  toolbar.appendChild(button);
  return button;
}

toolbarButton("Assemble", () => gameConsoleController.assemble(editor.value), true);
toolbarButton("Run", () => gameConsoleController.run());
toolbarButton("Stop", () => gameConsoleController.stop());
toolbarButton("Step", () => gameConsoleController.step());
toolbarButton("Reset", () => {
  gameConsoleController.reset();
  view.reset();
});
toolbar.appendChild(stateLabel);

// --- The spike view ---
const view = new AdwDebuggerView();

main.append(editor, toolbar, view);
overlay.append(headerBar, main);
document.body.appendChild(overlay);

// --- Wire the shared controller layer (same seam as GNOME/Android) ---
gameConsoleController.initPartial({ memory, simulator, assembler, labels });
view.initialize(assembler, simulator);
// The debugger page is always visible here — mark it active (the Android twin
// does the same in its screen's onShow).
view.state = DebuggerState.ACTIVE;

const bridge = new GameConsoleEventBridge({
  formatAndLog: (message, params) => {
    // Web: English only, printf-style substitution via formatMessage
    debuggerController.log(formatMessage(message, params ?? []));
  },
  updateDebugger: () => {
    view.update(memory, simulator);
  },
  updateAssemblerViews: (asm) => {
    view.updateHexdump(asm);
    view.updateDisassembled(asm);
  },
  updateUiState: (state) => {
    stateLabel.textContent = state ?? simulator.state;
  },
  showNotification: (key) => {
    overlay.addToast(NOTIFICATION_TITLES[key] ?? key);
  },
  updateDebugInfo: () => {
    if (simulator.stepperEnabled) view.update(memory, simulator);
  },
});
bridge.connect();

// Platform-level handling of controller events the view leaves to the host
// (the Android twin routes this to its editor via mainStateController).
debuggerController.on("copyToEditor", (code: string) => {
  editor.value = code;
  overlay.addToast("Code copied to editor");
});
debuggerController.on("copyToClipboard", () => {
  overlay.addToast("Copied to clipboard");
});
