import type { MessageConsoleWidget } from "./index.js";

export class DummyMessageConsole implements MessageConsoleWidget {
  constructor() {}

  public log(message: string) {
    console.log(message);
  }

  public warn(message: string) {
    console.warn(message);
  }

  public error(message: string) {
    console.error(message);
  }

  public clear() {
    console.clear();
  }

  public prompt(message: string, defaultValue?: string): string | null {
    throw new Error("Not implemented");
  }
}
