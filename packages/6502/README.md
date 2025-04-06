# 6502 Package

This package contains a TypeScript implementation of a 6502 assembler and simulator, originally developed by Stian Soreng and adapted by Nick Morgan for the easy6502 tutorial.

## Features

- **Assembler**: Convert 6502 assembly code to machine code
- **Simulator**: Execute 6502 machine code with cycle-accurate emulation
- **Debugger Support**: Monitor registers, flags, and memory in real-time
- **Memory Management**: Handle the 6502's 16-bit address space
- **Instruction Set**: Support for all 6502 instructions and addressing modes

## History

- Original implementation by Stian Soreng (2006-2010) - www.6502asm.com
- Adapted by Nick Morgan for easy6502 tutorial - https://github.com/skilldrick/6502js
- Further adapted for this project to support both GNOME and web applications

## Usage

This package is used internally by both the GNOME application and web version to provide the core 6502 emulation functionality. It's not meant to be used directly, but rather as a dependency for the main applications.

## Development

To build this package:

```bash
yarn build
```

## License

This package is licensed under the [GNU General Public License](http://gnu.org/licenses/gpl.html).