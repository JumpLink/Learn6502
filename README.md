
# Easy6502

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

## Modern 6502 Assembly Learning Environment for GNOME

Easy6502 is a modern, native Adwaita application for the GNOME desktop environment that provides a complete learning environment for 6502 assembly language programming. Built with GJS and TypeScript, this application brings the classic Easy6502 tutorial by Nick Morgan to your desktop as a beautiful, integrated experience.

![Screenshot of Easy6502 GNOME Application](./assets/1.png)
*Screenshot of the Easy6502 GNOME application*

## Features

- **Interactive Tutorial**: A comprehensive step-by-step guide to learning 6502 assembly language, with explanations of all core concepts
- **Code Editor**: Write and edit your 6502 assembly code with syntax highlighting
- **Assembler & Debugger**: Assemble your code and debug it with a powerful built-in debugger showing registers, flags, and memory in real-time
- **Visual Game Console**: See your code in action on a virtual display, perfect for creating simple games and graphics
- **Built with Modern Technologies**: Developed in GJS and TypeScript with Adwaita styling for a native GNOME experience

This project is a complete rewrite of the original web-based Easy6502 tutorial, transformed into a native GNOME application while preserving the core functionality that made the original so effective for learning 6502 assembly.

## Packages

- `app-gnome`: The main GNOME desktop application with Adwaita styling
- `app-web`: The classic web application as it originally looked
- `6502`: The core 6502 simulator, assembler, and disassembler library

## Development

To get a initial development environment, run `yarn install && yarn setup && yarn build && yarn start` to install the dependencies, setup the monorepo, build the packages, and start the GNOME app.

### Building

To build the packages, run `yarn build` in the root of the repository.

### Running

To run the packages, run `yarn start:gnome` for the GNOME app or `yarn start:web` for the web app.

## Contributing

Contributions are welcome :)
