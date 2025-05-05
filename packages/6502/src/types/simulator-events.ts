import type { SimulatorBaseEvent } from "./simulator-base-event.js";

/**
 * Event emitted when the simulator starts execution
 */
export interface SimulatorStartEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator executes a single instruction
 */
export interface SimulatorStepEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator executes multiple instructions at once
 */
export interface SimulatorMultiStepEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator is reset
 */
export interface SimulatorResetEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator stops execution
 */
export interface SimulatorStopEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator jumps to a specific address
 */
export interface SimulatorGotoEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when the simulator encounters a failure
 */
export interface SimulatorFailureEvent extends SimulatorBaseEvent {}

/**
 * Event emitted for general simulator information
 */
export interface SimulatorInfoEvent extends SimulatorBaseEvent {}

/**
 * Event emitted when a pseudo-operation is executed
 */
export interface SimulatorPseudoOpEvent extends SimulatorBaseEvent {
  /** The type of pseudo-op that was executed */
  type: string;
}
