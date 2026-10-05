import type { MessageConsoleWidget } from "@learn6502/common-ui";

/**
 * MessageConsole — auto-scrolling monospace message log for the debugger.
 *
 * Web twin of app-android's `MessageConsole extends TextView` and app-gnome's
 * `message-console.blp`: a custom element wrapping a `<pre><code>` block.
 * All logic stays in `debuggerController`; this widget only renders text.
 */
export class MessageConsole extends HTMLElement implements MessageConsoleWidget {
  private output: HTMLElement | null = null;

  connectedCallback(): void {
    this.ensureBuilt();
  }

  public log(message: string): void {
    this.appendLine(message);
  }

  public warn(message: string): void {
    this.appendLine(`⚠ ${message}`);
  }

  public error(message: string): void {
    this.appendLine(`✗ ${message}`);
  }

  public clear(): void {
    this.ensureBuilt().textContent = "";
  }

  public prompt(message: string, defaultValue?: string): string | null {
    return window.prompt(message, defaultValue);
  }

  private ensureBuilt(): HTMLElement {
    if (this.output) return this.output;
    const pre = document.createElement("pre");
    this.output = document.createElement("code");
    pre.appendChild(this.output);
    this.replaceChildren(pre);
    return this.output;
  }

  private appendLine(message: string): void {
    const output = this.ensureBuilt();
    output.textContent += `${message}\n`;
    // Keep the newest message visible (the <pre> is the scroll container).
    const pre = output.parentElement;
    if (pre) pre.scrollTop = pre.scrollHeight;
  }
}

customElements.define("learn-message-console", MessageConsole);
