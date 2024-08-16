export class MessageConsole {
  constructor(private readonly node: HTMLElement) {}

  log(message: string) {
    message += '\n'; // allow put operations from the simulator (WDM opcode)
    this.node.innerText += message;
  }

  clear() {
    this.node.innerHTML = '';
  }
}