import type { Memory } from './memory.js';

export function Display(node: HTMLElement) {
  const palette = [
    "#000000", "#ffffff", "#880000", "#aaffee",
    "#cc44cc", "#00cc55", "#0000aa", "#eeee77",
    "#dd8855", "#664400", "#ff7777", "#333333",
    "#777777", "#aaff66", "#0088ff", "#bbbbbb"
  ];
  let ctx: CanvasRenderingContext2D | null = null;
  let width: number;
  let height: number;
  let pixelSize: number;
  let numX = 32;
  let numY = 32;

  function initialize() {
    const canvas = node.querySelector<HTMLCanvasElement>('.screen');
    if (!canvas) {
      throw new Error('Canvas not found');
    }
    width = canvas.width || 160;
    height = canvas.height || 160;
    pixelSize = width / numX;
    ctx = canvas.getContext('2d');
    reset();
  }

  function reset() {
    if (!ctx) {
      return;
    }
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
  }

  function updatePixel(addr: number, memory: ReturnType<typeof Memory>) {
    if (!ctx) {
      return;
    }
    ctx.fillStyle = palette[memory.get(addr) & 0x0f];
    const y = Math.floor((addr - 0x200) / 32);
    const x = (addr - 0x200) % 32;
    ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
  }

  return {
    initialize: initialize,
    reset: reset,
    updatePixel: updatePixel
  };
}