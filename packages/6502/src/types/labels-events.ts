import type { Labels } from "../labels.js";

/**
 * Base interface for all labels events
 */
export interface LabelsBaseEvent {
  /** The labels instance that triggered the event */
  labels: Labels;
  /** A message to display to the user */
  message?: string;
  /** Additional parameters for the message */
  params?: (string | number | boolean | null | undefined)[];
}

/**
 * Event emitted for informational messages from the Labels class
 */
export interface LabelsInfoEvent extends LabelsBaseEvent {}

/**
 * Event emitted when the Labels class encounters a failure
 */
export interface LabelsFailureEvent extends LabelsBaseEvent {}
