import { TextView, EventData } from "@nativescript/core";
import type { MessageConsoleWidget } from "@learn6502/common-ui";

export class MessageConsole extends TextView implements MessageConsoleWidget {
  constructor() {
    super();
  }

  public log(message: string): void {
    const currentText = this.text || "";
    const newText = currentText ? `${currentText}\n${message}` : message;
    this.text = newText;
    this.scrollToBottom();
  }

  public warn(message: string): void {
    const currentText = this.text || "";
    const warningMessage = `⚠️ ${message}`;
    const newText = currentText
      ? `${currentText}\n${warningMessage}`
      : warningMessage;
    this.text = newText;
    this.scrollToBottom();
  }

  public error(message: string): void {
    const currentText = this.text || "";
    const errorMessage = `❌ ${message}`;
    const newText = currentText
      ? `${currentText}\n${errorMessage}`
      : errorMessage;
    this.text = newText;
    this.scrollToBottom();
  }

  public clear(): void {
    this.text = "";
  }

  public prompt(message: string, defaultValue?: string): string | null {
    // Not implemented for Android
    console.warn("MessageConsole.prompt not implemented on Android");
    return null;
  }

  private scrollToBottom(): void {
    // Scroll to bottom after text update
    setTimeout(() => {
      if (this.android) {
        const scrollY = this.android.getLayout()?.getHeight() || 0;
        this.android.scrollTo(0, scrollY);
      }
    }, 10);
  }
}
