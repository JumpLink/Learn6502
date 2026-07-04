# Learn 6502 Assembly — Web App

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

The web version of [Learn 6502 Assembly](../../README.md), built as an Adwaita
single-page app on [`@gjsify/adwaita-web`](https://www.npmjs.com/package/@gjsify/adwaita-web).
It looks and behaves like the native GNOME desktop app (`../app-gnome`), sharing
the same `@learn6502/common-ui` controllers and `@learn6502/core` assembler /
simulator — the four views (Learn, Editor, Debugger, Game Console) are the web
twins of the GNOME views.

The original skilldrick tutorial can still be found at
http://skilldrick.github.io/easy6502/.

## Development

```bash
gjsify install
gjsify run dev:app     # Vite dev server with HMR
```

Production build (what the GitHub Pages deploy runs):

```bash
gjsify run build:app   # → dist-app/{index.html,app.js}  (gjsify build --app browser)
gjsify run preview:app # preview the built output
```

Type-check: `gjsify run check`.

## License

Licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/),
maintaining the original license from Nick Morgan's work.
