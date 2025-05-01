import type { Labels } from "../labels.js";

export interface LabelsEvent {
  labels: Labels;
  /** A message to display to the user */
  message?: string;
  /** Additional parameters for the message */
  params?: (string | number | boolean | null | undefined)[];
}
