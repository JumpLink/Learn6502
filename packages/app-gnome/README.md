# Learn 6502 Assembly for GNOME

This package contains the source code for the Learn 6502 Assembly GNOME app.

## Development

### Local Development

To build and run the application locally:

```bash
# Install dependencies
yarn install

# Build the application and its dependencies in this yarn workspace
yarn build:with-deps

# Start the application
yarn start
```

### Flatpak Build

The application can also be built and installed as a Flatpak. See the root [README.md](../../README.md) for instructions on building the Flatpak package.

## Project Structure

- `src/`: Main application source code
- `data/`: Application resources
- `dist/`: Build output directory

## Dependencies

The application depends on several GNOME libraries and internal packages:

- GNOME libraries (GJS, GTK, Adwaita, etc.)
- Internal packages:
  - `@learn6502/6502`: 6502 simulator and assembler
  - `@learn6502/learn`: Tutorial content
  - `@learn6502/translations`: Localization support

```bash
yarn start
```
