export function addr2hex(addr: number) {
  return num2hex((addr >> 8) & 0xff) + num2hex(addr & 0xff);
}

export function num2hex(nr: number) {
  const str = "0123456789abcdef";
  const hi = ((nr & 0xf0) >> 4);
  const lo = (nr & 15);
  return str.substring(hi, hi + 1) + str.substring(lo, lo + 1);
}

// Prints text in the message window
export function message(node: HTMLElement, text: string) {
  if (text.length > 1)
    text += '\n'; // allow putc operations from the simulator (WDM opcode)
  node.querySelector('.messages code')?.append(text) // .scrollTop(10000);
}