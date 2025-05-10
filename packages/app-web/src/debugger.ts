import {
  Simulator,
  Memory,
  addr2hex,
  num2hex,
  throttle,
  Assembler,
} from "@learn6502/6502";

import {
  DebuggerState,
  type DebuggerWidget,
  type HexMonitorOptions,
} from "@learn6502/common-ui";

export class Debugger implements DebuggerWidget {
  public state = DebuggerState.INITIAL;
  constructor(
    private readonly node: HTMLElement,
    private readonly simulator: Simulator,
    public readonly memory: Memory,
    public readonly options: HexMonitorOptions
  ) {
    this.setupEventListeners();
    this.onMonitorRangeChange = this.onMonitorRangeChange.bind(this);
  }

  /**
   * Toggle the monitor.
   * The monitor is the part of the debugger that shows the memory.
   * @param state - The state of the monitor.
   */
  public toggleMonitor(state: boolean) {
    this.state = state ? DebuggerState.ACTIVE : DebuggerState.PAUSED;
  }

  /**
   * Set the monitor address range.
   */
  public setMonitorRange(startAddress: number, length: number) {
    this.options.start = startAddress;
    this.options.length = length;
  }

  /**
   * Handle the monitor range change.
   */
  public onMonitorRangeChange() {
    const $start = this.node.querySelector<HTMLInputElement>(".start"),
      $length = this.node.querySelector<HTMLInputElement>(".length"),
      start = parseInt($start?.value || "0", 16),
      length = parseInt($length?.value || "0", 16);

    $start?.classList.remove("monitor-invalid");
    $length?.classList.remove("monitor-invalid");

    const end = start + length - 1;

    if (isNaN(start) || start < 0 || start > 0xffff) {
      $start?.classList.add("monitor-invalid");
      console.error("start is invalid", start);
      return;
    } else if (isNaN(length) || end > 0xffff) {
      $length?.classList.add("monitor-invalid");
      console.error("length is invalid", length);
      return;
    }

    this.setMonitorRange(start, length);
  }

  private setupEventListeners() {
    this.simulator.on("step", () => {
      // If stepper is enabled, update the debug info and the monitor every step
      if (this.simulator.stepperEnabled) {
        this.update(this.memory, this.simulator);
      }
    });

    this.simulator.on("multistep", () => {
      this.update(this.memory, this.simulator);
    });

    this.simulator.on("reset", () => {
      this.update(this.memory, this.simulator);
    });
    this.simulator.on("goto", () => {
      this.update(this.memory, this.simulator);
    });

    this.update(this.memory, this.simulator);
  }

  public updateMonitor(memory: Memory) {
    if (this.state !== DebuggerState.ACTIVE) {
      return;
    }

    const start = this.options.start;
    const length = this.options.length;
    let content = "";

    const end = start + length - 1;

    if (
      !isNaN(start) &&
      !isNaN(length) &&
      start >= 0 &&
      length > 0 &&
      end <= 0xffff
    ) {
      content = memory.format({
        start,
        length,
        includeAddress: true,
        includeSpaces: true,
        includeNewline: true,
      });
    } else {
      content =
        "Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.";
    }

    const monitorNode = this.node.querySelector<HTMLElement>(".monitor code");

    if (!monitorNode) {
      return;
    }

    monitorNode.innerHTML = content;
  }

  public updateDebugInfo(simulator: Simulator) {
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;
    let html =
      "A=$" +
      num2hex(regA) +
      " X=$" +
      num2hex(regX) +
      " Y=$" +
      num2hex(regY) +
      "<br />";
    html += "SP=$" + num2hex(regSP) + " PC=$" + addr2hex(regPC);
    html += "<br />";
    html += "NV-BDIZC<br />";
    for (let i = 7; i >= 0; i--) {
      html += (regP >> i) & 1;
    }
    const minidebugger = this.node.querySelector<HTMLElement>(".minidebugger");
    if (minidebugger) {
      minidebugger.innerHTML = html;
    }
  }

  #update(memory: Memory, simulator: Simulator) {
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  /**
   * Update the debugger.
   * @note This is throttled to 349ms to prevent excessive CPU usage.
   * @param memory - The memory to update the hex monitor.
   * @param simulator - The simulator to update the debug info.
   */
  public update = throttle(this.#update.bind(this), 349); // Prime number

  /**
   * Update the hexdump view
   * @param assembler Assembler with assembled code
   */
  public updateHexdump(assembler: Assembler): void {
    // Placeholder for future implementation
    console.log("updateHexdump not yet implemented in web version");
  }

  /**
   * Update the disassembled view
   * @param assembler Assembler with assembled code
   */
  public updateDisassembled(assembler: Assembler): void {
    // Placeholder for future implementation
    console.log("updateDisassembled not yet implemented in web version");
  }

  /**
   * Log a message to the debugger console
   * @param message Message to log
   */
  public log(message: string): void {
    // Placeholder for future implementation
    console.log(`Debugger log: ${message}`);
  }

  public reset() {
    this.state = DebuggerState.RESET;
  }

  /**
   * Clean up resources when closing
   */
  public close(): void {
    // Remove event listeners or perform any cleanup
    // This is a placeholder for now, as web version may not need explicit cleanup
  }
}
