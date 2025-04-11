import type { Assembler } from '../assembler.js'

export interface Disassembled {
    update(assembler: Assembler): void
}