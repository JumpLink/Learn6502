export class MessageConsole {
  constructor(private readonly node: HTMLElement) {}

  public log(message: string) {
    message += '\n'; // allow put operations from the simulator (WDM opcode)
    this.node.innerText += message;
  }

  public clear() {
    this.node.innerHTML = '';
  }
}