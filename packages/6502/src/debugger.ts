import { Simulator } from './simulator.js';
import { Memory } from './memory.js';
import { addr2hex, num2hex } from './utils.js';

export class Debugger {

  private monitoring = false;

  constructor(private readonly node: HTMLElement, private readonly simulator: Simulator, private readonly memory: Memory) {
    this.simulator.on('step', () => {
      // If stepper is enabled, update the debug info and the monitor every step
      if (this.simulator.stepper) {
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
  public handleMonitorRangeChange() {
    const $start = this.node.querySelector<HTMLInputElement>('.start'),
      $length = this.node.querySelector<HTMLInputElement>('.length'),
      start = parseInt($start?.value || '0', 16),
      length = parseInt($length?.value || '0', 16),
      end = start + length - 1;

    $start?.classList.remove('monitor-invalid');
    $length?.classList.remove('monitor-invalid');

    if (isNaN(start) || start < 0 || start > 0xffff) {

      $start?.classList.add('monitor-invalid');

    } else if (isNaN(length) || end > 0xffff) {

      $length?.classList.add('monitor-invalid');
    }
  }

  private updateMonitor() {
    if (!this.monitoring) {
      return;
    }

    const start = parseInt(this.node.querySelector<HTMLInputElement>('.start')?.value || '0', 16);
    const length = parseInt(this.node.querySelector<HTMLInputElement>('.length')?.value || '0', 16);

    const end = start + length - 1;

    const monitorNode = this.node.querySelector<HTMLElement>('.monitor code');

    if (!monitorNode) {
      return;
    }

    if (!isNaN(start) && !isNaN(length) && start >= 0 && length > 0 && end <= 0xffff) {
      monitorNode.innerHTML = this.memory.format(start, length);
    } else {
      monitorNode.innerHTML = 'Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.';
    }
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