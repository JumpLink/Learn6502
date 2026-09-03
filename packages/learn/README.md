# Learn Package

This package contains the core tutorial content for learning 6502 assembly language programming. The content is written in a Markdown [MDX](https://mdxjs.com/) format and can be transformed into various output formats to support different platforms.

## Content

The main tutorial content is stored in `tutorial.mdx`, which is based on Nick Morgan's original Easy6502 tutorial. The content is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

## Transformation Capabilities

Each MDX document is rendered into one artifact per platform, and each artifact has exactly one
consumer:

| Artifact                | Consumer    | Loaded by                                             |
| ----------------------- | ----------- | ----------------------------------------------------- |
| `dist/*.ui`             | app-gnome   | `Gtk.Builder`, as a `MdxView` template                |
| `dist/*.ns.xml`         | app-android | NativeScript `Builder.load` (copied to `app/mdx/`)    |
| `dist/*.html`           | app-web     | imported by the web tutorial view                     |

`packages/translations` is a fourth consumer: its `xgettext` run extracts the tutorial's
translatable strings from `dist/*.ui`, which is why `@learn6502/translations`'s build builds this
package first.

## Development

The transformation process is handled by TypeScript components in the `tsx/` directory:

- `components/`: UI components for different tutorial elements
- `enums/`: Type definitions and constants
- `examples/`: 6502 assembly code examples used in the tutorial

### Building

To build the transformed content:

```bash
gjsify run build
```

This will generate the necessary output files in the `dist/` directory.

### Checking

```bash
gjsify workspace @learn6502/learn check
```

`check.js` rebuilds `dist/` and then validates the generated artifacts structurally — no byte
snapshot, so it survives reformatting the emitter but still fails on the changes that cost a
reader something. CI runs it on every pull request. It asserts that:

- all six artifacts were written;
- the `.ui` and `.ns.xml` are well-formed XML with the expected root, and contain only elements
  and object classes their consumer can resolve — `Gtk.Builder` and NativeScript's `Builder.load`
  both refuse the whole document otherwise;
- every translatable label carries its `TRANSLATORS:` comment, which is the only context a
  translator gets (the catalogs are generated with `noLocation`);
- every label is markup Pango accepts. A `Gtk.Label` whose markup fails to parse renders as an
  empty string, so an HTML-only entity such as `&ndash;` costs the reader the whole paragraph —
  write the character itself (`–`, `×`) in the MDX;
- the same code literals reach all three targets. They are what the reader retypes into the
  editor, and each target encodes them differently (`<tt>`, an escaped `w:SourceView`, `<code>`).

It says nothing about whether the tutorial is *correct*; that still needs a reader.

## License

- The tutorial content is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
- The transformation code and build system are licensed under the [GNU General Public License v3](../../LICENSE)
