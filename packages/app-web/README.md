# Easy6502 Web App

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

This package contains the classic web version of Easy6502 by Nick Morgan, a one-stop accessible tutorial on 6502 assembly language programming. It includes a series of worked example programs which you can edit and run in the embedded simulator.

This web version is maintained as part of the larger [Learn 6502 Assembly](../../README.md) project, which also provides a modern GNOME desktop application. While the GNOME app offers an enhanced experience, we maintain this web version to preserve the original tutorial's accessibility and simplicity.

The original version can still be found at http://skilldrick.github.io/easy6502/.

## Development

### Installation

To run the web version locally, execute the following commands:

```
    gjsify install
    gjsify run setup
    gjsify run build
    gjsify run start
```

This will serve the site at http://localhost:4000.

### DebuggerView spike (ADR 0007)

`debugger-spike.html` is a dev-only page (not linked from the Jekyll site) that
renders `AdwDebuggerView` — the shared `DebuggerView` interface from
`@learn6502/common-ui` implemented over `@gjsify/adwaita-web` custom elements,
driven by the same `debuggerController` the GNOME and Android apps use. Open it
with:

```
    npx vite                    # dev server → http://localhost:5173/debugger-spike.html
    # or, after `gjsify run build` (spike bundles to dist-spike/, kept out of the site):
    npx vite preview --config vite.spike.config.js
```

The classic widget on the simulator page is untouched — the spike view lives
alongside it (see `src/views/adw-debugger.ts` and `src/widgets/debugger/`).

## License

This package is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/), maintaining the original license from Nick Morgan's work.
