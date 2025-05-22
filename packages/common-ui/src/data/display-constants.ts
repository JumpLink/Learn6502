import type { DisplayConfig } from "../types/display-config";

/**
 * Default display configuration
 */
export const DEFAULT_DISPLAY_CONFIG: DisplayConfig = {
  width: 320,
  height: 320,
  numX: 32,
  numY: 32,
};

/**
 * Default color palette for the display
 * Each color corresponds to a value in memory (0-15)
 */
export const DEFAULT_COLOR_PALETTE: string[] = [
  "#000000", // $0: Black
  "#ffffff", // $1: White
  "#880000", // $2: Red
  "#aaffee", // $3: Cyan
  "#cc44cc", // $4: Purple
  "#00cc55", // $5: Green
  "#0000aa", // $6: Blue
  "#eeee77", // $7: Yellow
  "#dd8855", // $8: Orange
  "#664400", // $9: Brown
  "#ff7777", // $a: Light red
  "#333333", // $b: Dark grey
  "#777777", // $c: Grey
  "#aaff66", // $d: Light green
  "#0088ff", // $e: Light blue
  "#bbbbbb", // $f: Light grey
];
