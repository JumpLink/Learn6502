import type { DebuggerOptions, DebuggerState, Memory, Simulator } from '../index.js'

export interface Debugger {
    options: DebuggerOptions
    state: DebuggerState
    update(memory: Memory, simulator: Simulator): void
    updateMonitor(memory: Memory): void
    updateDebugInfo(simulator: Simulator): void
    reset(): void
}