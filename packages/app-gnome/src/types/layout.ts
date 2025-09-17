import Gtk from "@girs/gtk-4.0";
import { ViewType } from "@learn6502/common-ui";

export enum LayoutMode {
  Single = "single",
  SplitHorizontal = "split-horizontal",
  SplitVertical = "split-vertical",
  Grid2x2 = "grid-2x2",
}

export type LayoutRegion = "left" | "right" | "top" | "bottom";

export interface LayoutHost {
  attach(view: ViewType, widget: Gtk.Widget): void;
  show(view: ViewType): void;
  getActiveView(): ViewType;
  dispose(): void;
}

/** Map a view to a region for the given layout mode. */
export function getRegionForView(
  mode: LayoutMode,
  view: ViewType
): LayoutRegion {
  const isLeftOrTop = view === ViewType.LEARN || view === ViewType.DEBUGGER;

  switch (mode) {
    case LayoutMode.SplitHorizontal:
      return isLeftOrTop ? "left" : "right";
    case LayoutMode.SplitVertical:
      return isLeftOrTop ? "top" : "bottom";
    case LayoutMode.Grid2x2:
      // In grid mode, keep the same grouping semantics
      return isLeftOrTop ? "left" : "right";
    case LayoutMode.Single:
    default:
      // Single has no regions; default to left
      return "left";
  }
}
