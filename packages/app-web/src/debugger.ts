import { Simulator, Memory, addr2hex, num2hex, type DebuggerOptions, type MonitorOptions } from '@easy6502/6502';

export class Debugger {

  private monitoring = false;

  private monitor: MonitorOptions;

  constructor(private readonly node: HTMLElement, private readonly simulator: Simulator, private readonly memory: Memory, options: DebuggerOptions) {
    this.monitor = options.monitor;
    this.setupEventListeners();
  }

  /**
   * Toggle the monitor.
   * The monitor is the part of the debugger that shows the memory.
   * @param state - The state of the monitor.
   */
  public toggleMonitor(state: boolean) {
    this.monitoring = state;
  }

  /**
   * Handle the monitor range change.
   */
  public setMonitorRange(startAddress: number, length: number) {
    this.monitor.start = startAddress;
    this.monitor.length = length;
  }

  private setupEventListeners() {
    this.simulator.on('step', () => {
      // If stepper is enabled, update the debug info and the monitor every step
      if (this.simulator.stepperEnabled) {
        this.updateDebugInfo();
        this.updateMonitor();
      }
    });

    this.simulator.on('multistep', () => {
      this.updateDebugInfo();
      this.updateMonitor();
    });

    this.simulator.on('reset', () => {
      this.updateDebugInfo();
      this.updateMonitor();
    });

    this.simulator.on('goto', () => {
      this.updateDebugInfo();
      this.updateMonitor();
    });

    this.updateDebugInfo();
    this.updateMonitor();
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

    if (isNaN(start) || start < 0 || start > 0xffff) {
      $start?.classList.add('monitor-invalid');
      return;
    } else if (isNaN(length) || end > 0xffff) {
      $length?.classList.add('monitor-invalid');
      return;
    }

    this.setMonitorRange(start, length);
  }

  private updateMonitor() {
    if (!this.monitoring) {
      return;
    }

    const start = this.monitor.start;
    const length = this.monitor.length;
    let content = '';

    const end = start + length - 1;

    if (!isNaN(start) && !isNaN(length) && start >= 0 && length > 0 && end <= 0xffff) {
      content = this.memory.format(start, length);
    } else {
      content = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }

    const monitorNode = this.node.querySelector<HTMLElement>('.monitor code');

    if (!monitorNode) {
      return;
    }

    monitorNode.innerHTML = content;
  }

  private updateDebugInfo() {
    const { regA, regX, regY, regP, regPC, regSP } = this.simulator.info;
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
}