import { TextView, EventData } from "@nativescript/core";
import type { MessageConsoleWidget } from "@learn6502/common-ui";

export class MessageConsole extends TextView implements MessageConsoleWidget {
  private messages: string[] = [];

  constructor() {
    super();
  }

  public log(message: string): void {
    this.messages.push(message);
    this.updateText();
  }

  public warn(message: string): void {
    this.messages.push(`⚠️ ${message}`);
    this.updateText();
  }

  public error(message: string): void {
    this.messages.push(`❌ ${message}`);
    this.updateText();
  }

  public clear(): void {
    this.messages = [];
    this.text = "";
  }

  public prompt(message: string, defaultValue?: string): string | null {
    // Not implemented for Android
    console.warn("MessageConsole.prompt not implemented on Android");
    return null;
  }

  private updateText(): void {
    this.text = this.messages.join("\n");

    // Scroll to bottom after text update
    setTimeout(() => {
      if (this.android) {
        const scrollY = this.android.getLayout()?.getHeight() || 0;
        this.android.scrollTo(0, scrollY);
      }
    }, 10);
  }
}
