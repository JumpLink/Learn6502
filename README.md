# Easy6502
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

Easy6502 by Nick Morgan is one-stop accessible tutorial on 6502 assembly language programming, including a series of worked example programs which you can edit and run in the embedded emulator. This repository is a fork of the original repository as a monorepo to bring the project to a modern basis and divide it into smaller, more reusable packages.

The main goal of this project is to port Easy6502 to the GNOME desktop environment as a native Adwaita application while keeping the core components runtime-independent. This approach ensures that the core functionality can continue to run in browsers and other runtime environments.

## Packages

- `app-gnome`: The main application for the GNOME desktop (Not working yet).
- `app-web`: The classic application for the browser as it originally looked.
- `6502`: The 6502 simulator, assembler, and disassembler.

## Development

To get a initial development environment, run `yarn install && yarn setup && yarn build && yarn start` to install the dependencies, setup the monorepo, build the packages, and start the GNOME app.

### Building

To build the packages, run `yarn build` in the root of the repository.

### Running

To run the packages, run `yarn start:gnome` for the GNOME app or `yarn start:web` for the web app.

## Contributing

Contributing are welcome :)
