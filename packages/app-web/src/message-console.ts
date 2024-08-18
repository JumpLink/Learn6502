import type { MessageConsole as MessageConsoleInterface } from '@easy6502/6502';

export class MessageConsole implements MessageConsoleInterface {
  constructor(private readonly node: HTMLElement) {}

  public log(message: string) {
    message += '\n'; // allow put operations from the simulator (WDM opcode)
    this.node.innerText += message;
  }

  public warn(message: string) {
    this.node.innerText += `\n\n${message}`;
  }

  public error(message: string) {
    this.node.innerText += `\n\n${message}`;
  }

  public clear() {
    this.node.innerHTML = '';
  }

  public prompt(message: string, defaultValue?: string): string | null {
    return prompt(message, defaultValue);
  }
}