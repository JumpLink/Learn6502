import { _ } from "@learn6502/core";
import type { MemoryRegion } from "../types/index.js";

/**
 * Defined memory regions
 * These are used in the hex monitor.
 */
export const memoryRegions: MemoryRegion[] = [
  // We use the pseudo i18n function to localize the memory region names
  // TRANSLATORS: Memory region label for the zero page ($0000-$00FF)
  { name: _("Zero Page ($0000-$00FF)"), start: 0x0000, length: 0x0100 },
  // TRANSLATORS: Memory region label for the hardware stack ($0100-$01FF)
  { name: _("Stack ($0100-$01FF)"), start: 0x0100, length: 0x0100 },
  // TRANSLATORS: Memory region label for the display/screen buffer ($0200-$05FF)
  { name: _("Display Memory ($0200-$05FF)"), start: 0x0200, length: 0x0400 },
  // TRANSLATORS: Memory region label for program storage area ($0600-$FFFF)
  { name: _("Program Storage ($0600-$FFFF)"), start: 0x0600, length: 0x9a00 },
  // TRANSLATORS: Tutorial-specific region used by the Snake game
  { name: _("Snake Game Data ($00-$15)"), start: 0x0000, length: 0x0016 },
  // TRANSLATORS: Memory region label for random number and input registers ($FE-$FF)
  { name: _("Random/Input ($FE-$FF)"), start: 0x00fe, length: 0x0002 },
  // TRANSLATORS: Memory region label covering the full address space
  { name: _("Full Memory ($0000-$FFFF)"), start: 0x0000, length: 0x10000 },
];
