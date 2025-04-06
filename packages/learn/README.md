# Learn Package

This package contains the core tutorial content for learning 6502 assembly language programming. The content is written in MDX format and can be transformed into various output formats to support different platforms.

## Content

The main tutorial content is stored in `tutorial.mdx`, which is based on Nick Morgan's original Easy6502 tutorial. The content is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/).

## Transformation Capabilities

The package includes tools to transform the MDX content into different formats:

- **GNOME Application**: The content is transformed into GNOME Blueprint UI files (`.ui`) for use in the native GNOME application
- **Web Version**: Planned support for generating web-compatible content
- **Android App**: Potential future support for Android application content

## Development

The transformation process is handled by TypeScript components in the `tsx/` directory:

- `components/`: UI components for different tutorial elements
- `enums/`: Type definitions and constants
- `examples/`: 6502 assembly code examples used in the tutorial

### Building

To build the transformed content:

```bash
yarn build
```

This will generate the necessary output files in the `dist/` directory.

## License

- The tutorial content is licensed under the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/)
- The transformation code and build system are licensed under the [GNU General Public License v3](../../LICENSE) 