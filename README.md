# Easy6502
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

Easy6502 by Nick Morgan is one-stop accessible tutorial on 6502 assembly language programming, including a series of worked example programs which you can edit and run in the embedded emulator. This repository is a fork of the original repository as a monorepo to bring the project to a modern basis and divide it into smaller, more reusable packages.

## Packages

- `app-gnome`: The main application for the GNOME desktop (Not working yet).
- `app-web`: The main application for the browser.
- `6502`: The 6502 simulator, assembler, and disassembler.

The aim is to make the simulator runtime independent so that it can also be used outside the browser.

## Development

To get a initial development environment, run `yarn install && yarn setup && yarn build && yarn start:web` to install the dependencies, setup the monorepo, build the packages, and start the web app.

### Building

To build the packages, run `yarn build` in the root of the repository.

#### Meson

meson setup --reconfigure _build
meson compile -C _build

### Running

To run the packages, run `yarn start:gnome` or `yarn start:web` in the root of the repository.

## Contributing

Contributing are welcome :)
