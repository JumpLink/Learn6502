import type { DebuggerState, Memory, Simulator, Assembler } from '../index.js'

export interface Debugger {
    state: DebuggerState
    update(memory: Memory, simulator: Simulator): void
    updateMonitor(memory: Memory): void
    updateDebugInfo(simulator: Simulator): void
    reset(): void
}