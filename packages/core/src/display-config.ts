/**
 * Common display configuration parameters
 */
export interface DisplayConfig {
  /** Width of the display in pixels */
  width: number;
  /** Height of the display in pixels */
  height: number;
  /** Number of pixels in x direction */
  numX: number;
  /** Number of pixels in y direction */
  numY: number;
}

/**
 * RGB color components with normalized values (0-1)
 */
export interface RGBColor {
  /** Red component (0-1) */
  red: number;
  /** Green component (0-1) */
  green: number;
  /** Blue component (0-1) */
  blue: number;
}
