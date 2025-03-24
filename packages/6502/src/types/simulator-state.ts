export enum SimulatorState {
  /**
   * The simulator is ready but hasn't started yet, or has been reset
   * Program is loaded but not running
   */
  READY = 'ready',

  /**
   * The simulator was running but has been stopped
   */
  STOPPED = 'stopped',

  /**
   * The simulator is actively running code
   */
  RUNNING = 'running',

  /**
   * The simulator is in debugging mode with stepper enabled
   */
  DEBUGGING = 'debugging',

  /**
   * The simulator is in debugging mode, with code loaded but execution paused
   */
  DEBUGGING_PAUSED = 'debugging_paused'
}
