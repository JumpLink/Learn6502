export enum SimulatorState {
  /**
   * The simulator has been initialized but no program has been loaded yet
   */
  INITIALIZED = 'initialized',

  /**
   * The simulator has a program loaded but hasn't started yet, or has been reset
   * Program is ready to run
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
