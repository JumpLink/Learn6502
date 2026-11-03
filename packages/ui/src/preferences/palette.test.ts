import { describe, it, expect } from "@gjsify/unit";
import { computePalette, mixOklab, paletteToCss } from "./palette.ts";

export default async () => {
  await describe("palette — default purple tint", async () => {
    await it("light", async () => {
      expect(computePalette("purple", "system", false)).toStrictEqual({
        "--window-bg-color": "#c8a1d7",
        "--window-fg-color": "#000000",
        "--view-bg-color": "#dec6e8",
        "--view-fg-color": "#000000",
        "--card-bg-color": "#dec6e8",
        "--sidebar-bg-color": "#ceaed9",
        "--sidebar-backdrop-color": "#d3b7dd",
        "--popover-bg-color": "#e9d9f0",
        "--dialog-bg-color": "#d8bfe0",
      });
    });

    await it("dark", async () => {
      expect(computePalette("purple", "system", true)).toStrictEqual({
        "--window-bg-color": "#461c54",
        "--view-bg-color": "#15051b",
        "--card-bg-color": "#58316b",
        "--sidebar-bg-color": "#351340",
        "--sidebar-backdrop-color": "#250b2d",
        "--popover-bg-color": "#250b2d",
        "--dialog-bg-color": "#3e284d",
      });
    });
  });

  await describe("palette — other families and accents", async () => {
    await it("teal with an orange accent, light", async () => {
      const palette = computePalette("teal", "orange", false);
      expect(palette["--window-bg-color"]).toBe("#9bc7d1");
      expect(palette["--popover-bg-color"]).toBe("#d7e9ed");
      expect(palette["--accent-bg-color"]).toBe("#ed5b00");
      expect(palette["--accent-color"]).toBe("#b62200");
    });

    await it("teal with an orange accent, dark", async () => {
      const palette = computePalette("teal", "orange", true);
      expect(palette["--window-bg-color"]).toBe("#0b4550");
      expect(palette["--accent-color"]).toBe("#ff9c5b");
    });

    await it("none and system override nothing", async () => {
      expect(Object.keys(computePalette("none", "system", false)).length).toBe(0);
      expect(paletteToCss({})).toBe("");
    });

    await it("an accent alone leaves the surfaces alone", async () => {
      expect(
        Object.keys(computePalette("none", "blue", false))
          .sort()
          .join()
      ).toBe("--accent-bg-color,--accent-color");
    });
  });

  await describe("palette — oklab mix", async () => {
    await it("0% and 100% return the ends", async () => {
      expect(mixOklab("#9141ac", 100, "#ffffff")).toBe("#9141ac");
      expect(mixOklab("#9141ac", 0, "#ffffff")).toBe("#ffffff");
    });
  });
};
