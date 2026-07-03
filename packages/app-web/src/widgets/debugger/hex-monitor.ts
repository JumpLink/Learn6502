import { AdwComboRow, AdwPreferencesGroup } from "@gjsify/adwaita-web";
import type { HexMonitorEventMap, HexMonitorOptions, HexMonitorWidget, MemoryRegion } from "@learn6502/common-ui";
import { memoryRegions } from "@learn6502/common-ui";
import type { Memory } from "@learn6502/core";
import { EventDispatcher } from "@learn6502/core";
import { buildCodeCard } from "./code-card.js";

/**
 * HexMonitor — live memory view with a selectable memory region.
 *
 * Web twin of app-gnome's `hex-monitor.blp` (region dropdown + source view)
 * and app-android's `HexMonitor extends ScrollView`. The region select is an
 * `<adw-combo-row>` fed from the shared `memoryRegions` data; the dump is a
 * monospace code card with a copy button.
 *
 * @emits changed - when the selected memory region changes
 * @emits copy - when the user copies the monitor content
 */
export class HexMonitor extends HTMLElement implements HexMonitorWidget {
  readonly events = new EventDispatcher<HexMonitorEventMap>();

  readonly memoryRegions: MemoryRegion[] = memoryRegions;

  public options: HexMonitorOptions = {
    // Initial selection mirrors the GNOME debugger: Zero Page.
    start: 0x0000,
    length: 0x0100,
  };

  private output: HTMLElement | null = null;
  private lastContent = "";

  connectedCallback(): void {
    this.ensureBuilt();
  }

  public update(memory: Memory): void {
    this.ensureBuilt();
    const { start, length } = this.options;
    const end = start + length - 1;
    let content: string;

    if (!isNaN(start) && !isNaN(length) && start >= 0 && length > 0 && end <= 0xffff) {
      content = memory.format({
        start,
        length,
        includeAddress: true,
        includeSpaces: true,
        includeNewline: true,
      });
    } else {
      content = "Cannot monitor this range. Valid ranges are between $0000 and $ffff, inclusive.";
    }

    this.lastContent = content;
    if (this.output) this.output.textContent = content;
  }

  public setMonitorRange(start: number, length: number): void {
    this.options.start = start;
    this.options.length = length;
  }

  private ensureBuilt(): void {
    if (this.output) return;

    const group = new AdwPreferencesGroup();

    const regionRow = new AdwComboRow();
    regionRow.setAttribute("title", "Memory region");
    regionRow.setAttribute("items", JSON.stringify(this.memoryRegions.map((region) => region.name)));
    regionRow.setAttribute("selected", "0");
    regionRow.addEventListener("notify::selected", (event) => {
      const { selected } = (event as CustomEvent<{ selected: number }>).detail;
      this.applySelectedRegion(selected);
    });
    group.appendChild(regionRow);

    const { card, code, copyButton } = buildCodeCard("Copy memory dump");
    this.output = code;
    copyButton.addEventListener("click", () => {
      if (this.lastContent) this.events.dispatch("copy", { content: this.lastContent });
    });

    this.replaceChildren(group, card);
  }

  private applySelectedRegion(selectedIndex: number): void {
    if (selectedIndex < 0 || selectedIndex >= this.memoryRegions.length) return;
    const region = this.memoryRegions[selectedIndex];
    this.setMonitorRange(region.start, region.length);
    this.events.dispatch("changed", { content: this.lastContent, region });
  }
}

customElements.define("learn-hex-monitor", HexMonitor);
