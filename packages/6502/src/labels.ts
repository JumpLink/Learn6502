import type { Symbols } from './types/index.js';
import type { Assembler } from './assembler.js';
import type { MessageConsole } from './message-console.js';

/**
 * Manages labels for the 6502 assembler.
 */
export class Labels {
  private labelIndex: string[] = [];

  /**
   * Creates a new Labels instance.
   * @param console - The console where messages will be displayed.
   */
  constructor(private console: MessageConsole) {}


  /**
   * Checks if a label exists.
   * @param name - Label name to find.
   * @returns True if label exists, false otherwise.
   */
  public find(name: string): boolean {
    return this.labelIndex.some(label => label.split('|')[0] === name);
  }

  /**
   * Associates a label with an address.
   * @param name - Label name.
   * @param addr - Address to associate with the label.
   * @returns True if label was found and updated, false otherwise.
   */
  public setPC(name: string, addr: number): boolean {
    const index = this.labelIndex.findIndex(label => label.split('|')[0] === name);
    if (index !== -1) {
      this.labelIndex[index] = `${name}|${addr}`;
      return true;
    }
    return false;
  }

  /**
   * Gets the address associated with a label.
   * @param name - Label name.
   * @returns The address associated with the label, or -1 if not found.
   */
  public getPC(name: string): number {
    const label = this.labelIndex.find(label => label.split('|')[0] === name);
    return label ? Number(label.split('|')[1]) : -1;
  }

  /**
   * Displays a message about the number of labels found.
   */
  public displayMessage(): void {
    const count = this.labelIndex.length;
    const plural = count !== 1 ? 's' : '';
    this.console.log(`Found ${count} label${plural}.`);
  }

  /**
   * Resets the label index.
   */
  public reset(): void {
    this.labelIndex = [];
  }

  /**
   * Indexes labels from assembly code lines.
   * @param lines - Array of assembly code lines.
   * @param symbols - Symbols object for lookup.
   * @param assembler - Assembler instance.
   * @returns True if indexing was successful, false otherwise.
   */
  public indexLines(lines: string[], symbols: Symbols, assembler: Assembler): boolean {
    for (let i = 0; i < lines.length; i++) {
      if (!this.indexLine(lines[i], symbols, assembler)) {
        this.console.log(`**Label already defined at line ${i + 1}:** ${lines[i]}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Extracts label from a line and calculates its position in memory.
   * @param input - Single line of assembly code.
   * @param symbols - Symbols object for lookup.
   * @param assembler - Assembler instance.
   * @returns False if label already exists, true otherwise.
   */
  private indexLine(input: string, symbols: Symbols, assembler: Assembler): boolean {
    const currentPC = assembler.getCurrentPC();
    assembler.assembleLine(input, 0, symbols); // TODO: find a better way for Labels to have access to assembler

    if (input.match(/^\w+:/)) {
      const label = input.replace(/(^\w+):.*$/, "$1");
      
      if (symbols.lookup(label)) {
        this.console.log(`**Label ${label} is already used as a symbol; please rename one of them**`);
        return false;
      }
      
      return this.push(`${label}|${currentPC}`);
    }
    return true;
  }

  /**
   * Adds a label to the index.
   * @param name - Label name and address separated by '|'.
   * @returns False if label already exists, true otherwise.
   */
  private push(name: string): boolean {
    if (this.find(name.split('|')[0])) {
      return false;
    }
    this.labelIndex.push(`${name}|`);
    return true;
  }
}