import qrcode from "qrcode-generator";

// The encoder defaults to Latin-1 and would mangle any other character; EPC declares UTF-8.
qrcode.stringToBytes = (text) => [...new TextEncoder().encode(text)];

/**
 * Renders `text` as an inline SVG at build time. Error correction M, as the EPC spec prefers
 * (L is the minimum it allows). The quiet zone is part of the SVG and always light, so the code
 * scans on a dark theme too: scanners expect dark modules on a light ground.
 */
export function qrSvg(text: string, label: string, options: { margin?: number } = {}): string {
  const margin = options.margin ?? 4;
  const code = qrcode(0, "M");
  code.addData(text, "Byte");
  code.make();
  const count = code.getModuleCount();
  const size = count + margin * 2;
  let path = "";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (code.isDark(row, col)) path += `M${col + margin} ${row + margin}h1v1h-1z`;
    }
  }
  const title = label.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
  return `<svg class="qr" viewBox="0 0 ${size} ${size}" role="img" aria-label="${title}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}
