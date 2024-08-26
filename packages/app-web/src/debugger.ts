import { Simulator, Memory, addr2hex, num2hex, type DebuggerOptions, DebuggerState, type Debugger as DebuggerInterface } from '@easy6502/6502';

export class Debugger implements DebuggerInterface {

  public state = DebuggerState.INITIAL;
  constructor(private readonly node: HTMLElement, private readonly simulator: Simulator, public readonly memory: Memory, public readonly options: DebuggerOptions) {
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
    this.options.monitor.start = startAddress;
    this.options.monitor.length = length;
  }

  /**
   * Handle the monitor range change.
   */
  public onMonitorRangeChange() {
    const $start = this.node.querySelector<HTMLInputElement>('.start'),
      $length = this.node.querySelector<HTMLInputElement>('.length'),
      start = parseInt($start?.value || '0', 16),
      length = parseInt($length?.value || '0', 16);

    $start?.classList.remove('monitor-invalid');
    $length?.classList.remove('monitor-invalid');

    const end = start + length - 1;

    console.log("onMonitorRangeChange", start, length, end)

    if (isNaN(start) || start < 0 || start > 0xffff) {
      $start?.classList.add('monitor-invalid');
      console.error("start is invalid", start)
      return;
    } else if (isNaN(length) || end > 0xffff) {
      $length?.classList.add('monitor-invalid');
      console.error("length is invalid", length)
      return;
    }

    this.setMonitorRange(start, length);
  }

  private setupEventListeners() {
    this.simulator.on('step', () => {
      // If stepper is enabled, update the debug info and the monitor every step
      if (this.simulator.stepperEnabled) {
        this.updateDebugInfo(this.simulator);
        this.updateMonitor(this.memory);
      }
    });

    this.simulator.on('multistep', () => {
      this.updateDebugInfo(this.simulator);
      this.updateMonitor(this.memory);
    });

    this.simulator.on('reset', () => {
      this.updateDebugInfo(this.simulator);
      this.updateMonitor(this.memory);
    });

    this.simulator.on('goto', () => {
      this.updateDebugInfo(this.simulator);
      this.updateMonitor(this.memory);
    });

    this.updateDebugInfo(this.simulator);
    this.updateMonitor(this.memory);
  }

  public updateMonitor(memory: Memory) {
    if (this.state !== DebuggerState.ACTIVE) {
      return;
    }

    const start = this.options.monitor.start;
    const length = this.options.monitor.length;
    let content = '';

    const end = start + length - 1;

    if (!isNaN(start) && !isNaN(length) && start >= 0 && length > 0 && end <= 0xffff) {
      content = memory.format({ start, length, includeAddress: true, includeSpaces: true, includeNewline: true });
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    const monitorNode = this.node.querySelector<HTMLElement>('.monitor code');

    if (!monitorNode) {
      return;
    }

    monitorNode.innerHTML = content;
  }

  public updateDebugInfo(simulator: Simulator) {
    const { regA, regX, regY, regP, regPC, regSP } = simulator.info;
    let html = "A=$" + num2hex(regA) + " X=$" + num2hex(regX) + " Y=$" + num2hex(regY) + "<br />";
    html += "SP=$" + num2hex(regSP) + " PC=$" + addr2hex(regPC);
    html += "<br />";
    html += "NV-BDIZC<br />";
    for (let i = 7; i >= 0; i--) {
      html += regP >> i & 1;
    }
    const minidebugger = this.node.querySelector<HTMLElement>('.minidebugger');
    if (minidebugger) {
      minidebugger.innerHTML = html;
    }
  }

  public update(memory: Memory, simulator: Simulator) {
    this.updateMonitor(memory);
    this.updateDebugInfo(simulator);
  }

  public reset() {
    this.state = DebuggerState.RESET;
  }
}