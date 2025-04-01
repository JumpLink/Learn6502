# vite-plugin-gettext

A Vite plugin for managing GNU Gettext translations in your JavaScript/TypeScript applications.

## Features

- Extracts translatable strings from source files using xgettext
- Automatically compiles PO translation files to binary MO format
- Watches for changes and recompiles during development
- Follows GNU Gettext standard directory structure
- Supports multiple languages

## Installation

```bash
npm install @learn6502/vite-plugin-gettext --save-dev
```

or if you use Yarn:

```bash
yarn add @learn6502/vite-plugin-gettext -D
```

## Usage

Add both plugins to your Vite configuration:

```javascript
// vite.config.js / vite.config.ts
import { defineConfig } from 'vite';
import { xgettextPlugin, gettextPlugin } from '@learn6502/vite-plugin-gettext';
export default defineConfig({
    plugins: [
        // Extract strings to POT file
        xgettextPlugin({
            sources: ['src/**/*.{ts,js}'],
            output: 'po/messages.pot',
            domain: 'myapp',
            keywords: ['_', 'gettext', 'ngettext'],
            verbose: true
        }),
        // Compile PO files to MO format
        gettextPlugin({
            poDirectory: 'po',
            moDirectory: 'public',
            verbose: true
        })
    ]
});
```

## Requirements

- Vite 2.x or higher
- Node.js 12.x or higher
- GNU Gettext tools must be installed:
  - Ubuntu/Debian: `sudo apt-get install gettext`
  - Fedora: `sudo dnf install gettext`
  - Arch: `sudo pacman -S gettext`
  - macOS: `brew install gettext`

## How it Works

1. The `xgettextPlugin` extracts translatable strings from your source files into a POT template file
2. Translators create PO files for each language from the POT template
3. The `gettextPlugin` automatically compiles PO files to binary MO format
4. The MO files are placed in the standard gettext directory structure:
   `{moDirectory}/locale/{lang}/LC_MESSAGES/messages.mo`

## Plugin Options

### xgettextPlugin Options

- `sources`: Array of glob patterns for source files to extract strings from
- `output`: Output path for the POT template file
- `domain`: The gettext domain name (defaults to 'messages')
- `keywords`: Keywords to look for when extracting strings (defaults to ['_', 'gettext', 'ngettext'])
- `xgettextOptions`: Additional options to pass to xgettext command
- `verbose`: Enable verbose logging

### gettextPlugin Options

- `poDirectory`: Directory containing PO translation files
- `moDirectory`: Output directory for compiled MO files
- `verbose`: Enable verbose logging

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
